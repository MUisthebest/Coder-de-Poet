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
            .AsSplitQuery() 
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

        if (tests.Count == 0)
            return BadRequest(new { error = "no public testcases" });

        // build cases.json (string)
        var batch = new BatchPayload(
            tests.Select(tc => new BatchCase(tc.Id, tc.Ord, tc.InputData)).ToList()
        );
        var casesJson = JsonSerializer.Serialize(batch);

        // ONE docker run
        var (exitCode, stdout, stderr, timeMs, memKb) =
            await judge.RunBatchAsync(req.Language, req.SourceCode, casesJson);

        stdout = (stdout ?? "").Trim();
        stderr = stderr ?? "";

        // If runner crashed and output nothing -> RE
        if (exitCode != 0 && string.IsNullOrWhiteSpace(stdout))
        {
            var fallback = tests.Select(tc => new RunCaseResultDto(
                tc.Id, tc.Ord, "RE", false,
                "", tc.ExpectedOutput, stderr,
                timeMs, memKb
            )).ToList();

            return Ok(new RunResponseDto("RE", fallback));
        }

        // Parse runner JSON safely
        JsonDocument doc;
        try
        {
            // stdout sometimes starts with "warn..." -> not JSON -> don't crash API
            if (stdout.Length == 0 || (stdout[0] != '{' && stdout[0] != '['))
                throw new JsonException("Runner stdout is not JSON");

            doc = JsonDocument.Parse(stdout);
        }
        catch (Exception ex)
        {
            var debugMsg =
                $"Runner JSON parse failed: {ex.Message}\n" +
                $"--- stdout ---\n{stdout}\n" +
                $"--- stderr ---\n{stderr}";

            var fallback = tests.Select(tc => new RunCaseResultDto(
                tc.Id, tc.Ord, "RE", false,
                "", tc.ExpectedOutput, debugMsg,
                timeMs, memKb
            )).ToList();

            return Ok(new RunResponseDto("RE", fallback));
        }

        using (doc)
        {
            // Must contain {"results":[...]}
            if (!doc.RootElement.TryGetProperty("results", out var resultsEl) ||
                resultsEl.ValueKind != JsonValueKind.Array)
            {
                var debugMsg =
                    "Runner JSON missing 'results' array.\n" +
                    $"--- stdout ---\n{stdout}\n" +
                    $"--- stderr ---\n{stderr}";

                var fallback = tests.Select(tc => new RunCaseResultDto(
                    tc.Id, tc.Ord, "RE", false,
                    "", tc.ExpectedOutput, debugMsg,
                    timeMs, memKb
                )).ToList();

                return Ok(new RunResponseDto("RE", fallback));
            }

            var overall = "AC";
            var results = new List<RunCaseResultDto>();

            foreach (var item in resultsEl.EnumerateArray())
            {
                // Safe reads
                var testcaseId = item.TryGetProperty("testcaseId", out var idEl) && idEl.ValueKind == JsonValueKind.String
                    ? idEl.GetGuid()
                    : Guid.Empty;

                var ord = item.TryGetProperty("ord", out var ordEl) ? ordEl.GetInt32() : 0;
                var exit = item.TryGetProperty("exitCode", out var exEl) ? exEl.GetInt32() : 30;

                var outText = item.TryGetProperty("stdout", out var o) ? (o.GetString() ?? "") : "";
                var errText = item.TryGetProperty("stderr", out var e) ? (e.GetString() ?? "") : "";
                var caseTimeMs = item.TryGetProperty("timeMs", out var t) ? t.GetInt32() : 0;

                // Match testcase
                var tc = tests.FirstOrDefault(x => x.Id == testcaseId);
                if (tc is null)
                {
                    // Runner returned unknown testcaseId -> mark RE but keep going
                    var msg = $"Unknown testcaseId from runner: {testcaseId}\n--- stdout ---\n{stdout}\n--- stderr ---\n{stderr}";
                    overall = JudgeService.UpdateOverall(overall, "RE");

                    results.Add(new RunCaseResultDto(
                        Guid.Empty, ord, "RE", false,
                        outText, "", msg,
                        caseTimeMs, 0
                    ));
                    continue;
                }

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
            if (exitCode != 0 && overall == "AC")
                overall = "RE";

            return Ok(new RunResponseDto(overall, results));
        }
    }
}
