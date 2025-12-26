using IdeService.Data;
using IdeService.Dtos;
using IdeService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace IdeService.Controllers;

[ApiController]
[Route("api/run")]
public class RunController(IdeDbContext db, JudgeService judge) : ControllerBase
{
    private record BatchCase(Guid testcaseId, int ord, string input);
    private record BatchPayload(List<BatchCase> cases);

    [HttpPost]
    public async Task<ActionResult<RunResponseDto>> Run([FromBody] RunRequestDto req)
    {
        if (req.Language is not ("cpp" or "java" or "python"))
            return BadRequest(new { error = "unsupported language" });

        var p = await db.Problems
            .Include(x => x.Templates)
            .Include(x => x.Testcases)
            .FirstOrDefaultAsync(x => x.Id == req.ProblemId);

        if (p is null) return NotFound();

        if (!p.Templates.Any(t => t.Language == req.Language))
            return BadRequest(new { error = "template not found for language" });

        var tests = p.Testcases
            .Where(t => t.IsPublic)
            .OrderBy(t => t.Ord)
            .Take(3)
            .ToList();

        if (tests.Count == 0) return BadRequest(new { error = "no public testcases" });

        // build cases.json
        var batch = new BatchPayload(
            tests.Select(tc => new BatchCase(tc.Id, tc.Ord, tc.InputData)).ToList()
        );
        var casesJson = JsonSerializer.Serialize(batch);

        // ONE docker run
        var (exitCode, stdout, stderr, timeMs, memKb) =
            await judge.RunBatchAsync(req.Language, req.SourceCode, casesJson);

        // runner should output JSON: {"results":[...]}
        // If runner crashed -> treat as RE
        if (exitCode != 0 && string.IsNullOrWhiteSpace(stdout))
        {
            var fallback = new List<RunCaseResultDto>();
            foreach (var tc in tests)
            {
                fallback.Add(new RunCaseResultDto(
                    tc.Id, tc.Ord, "RE", false,
                    "", tc.ExpectedOutput, stderr,
                    timeMs, memKb
                ));
            }
            return Ok(new RunResponseDto("RE", fallback));
        }

        using var doc = JsonDocument.Parse(stdout);
        var arr = doc.RootElement.GetProperty("results").EnumerateArray();

        var overall = "AC";
        var results = new List<RunCaseResultDto>();

        foreach (var item in arr)
        {
            var testcaseId = item.GetProperty("testcaseId").GetGuid();
            var ord = item.GetProperty("ord").GetInt32();
            var exit = item.GetProperty("exitCode").GetInt32();
            var outText = item.TryGetProperty("stdout", out var o) ? (o.GetString() ?? "") : "";
            var errText = item.TryGetProperty("stderr", out var e) ? (e.GetString() ?? "") : "";
            var caseTimeMs = item.TryGetProperty("timeMs", out var t) ? t.GetInt32() : 0;

            var tc = tests.First(x => x.Id == testcaseId);

            var caseStatus = JudgeService.MapExitCode(exit);
            var passed = false;

            if (caseStatus == "OK")
            {
                passed = JudgeService.CheckOutput(tc.ExpectedOutput, outText);
                if (!passed) caseStatus = "WA";
            }

            overall = JudgeService.UpdateOverall(overall, caseStatus);

            results.Add(new RunCaseResultDto(
                tc.Id, ord, caseStatus, passed,
                outText, tc.ExpectedOutput, errText,
                caseTimeMs, 0
            ));

            if (caseStatus == "CE") break;
        }

        // if batch runner itself failed, bump overall
        if (exitCode != 0 && overall == "AC") overall = "RE";

        return Ok(new RunResponseDto(overall, results));
    }
}
