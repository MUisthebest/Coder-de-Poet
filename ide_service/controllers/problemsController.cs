using IdeService.Data;
using IdeService.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IdeService.Controllers;

[ApiController]
[Route("api/problems")]
public class ProblemsController(IdeDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProblemListItemDto>>> List()
    {
        var items = await db.Problems
            .OrderBy(p => p.Title)
            .Select(p => new ProblemListItemDto(p.Id, p.Slug, p.Title))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProblemDetailDto>> Detail(Guid id)
    {
        var p = await db.Problems
            .Include(x => x.Templates)
            .Include(x => x.Testcases)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p is null) return NotFound();

        var templates = p.Templates.ToDictionary(t => t.Language, t => t.StarterCode);

        var tc = p.Testcases
            .Where(t => t.IsPublic)
            .OrderBy(t => t.Ord)
            .Take(3)
            .Select(t => new TestcasePublicDto(t.Id, t.Ord, t.InputData, t.ExpectedOutput))
            .ToList();

        return Ok(new ProblemDetailDto(
            p.Id, p.Slug, p.Title, p.StatementMd,
            p.TimeLimitMs, p.MemoryLimitMb,
            templates, tc
        ));
    }
}
