using IdeService.Data;
using Microsoft.EntityFrameworkCore;

namespace IdeService.Services;

    public class SubmissionWorker(IServiceScopeFactory scopeFactory, IConfiguration cfg) : BackgroundService
    {
        private int IntervalMs => int.TryParse(cfg["Worker:IntervalMs"] ?? cfg["WORKER_INTERVAL_MS"], out var i) ? i : 1000;

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try { await ProcessOne(stoppingToken); }
                catch {  }

                await Task.Delay(IntervalMs, stoppingToken);
            }
        }

        private async Task ProcessOne(CancellationToken ct)
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IdeDbContext>();
            var judge = scope.ServiceProvider.GetRequiredService<JudgeService>();

            // Take 1 pending submission (SKIP LOCKED)
            var sub = await db.Submissions
                .FromSqlRaw(@"
                SELECT * FROM submissions
                WHERE status = 'PENDING'
                ORDER BY created_at
                FOR UPDATE SKIP LOCKED
                LIMIT 1")
                .AsTracking()
                .FirstOrDefaultAsync(ct);

            if (sub is null) return;

            sub.Status = "RUNNING";
            sub.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);

            var tests = await db.Testcases
                .Where(t => t.ProblemId == sub.ProblemId)
                .OrderBy(t => t.Ord)
                .ToListAsync(ct);

            // clear old cases
            db.SubmissionCases.RemoveRange(db.SubmissionCases.Where(x => x.SubmissionId == sub.Id));
            await db.SaveChangesAsync(ct);

            var overall = "AC";

            foreach (var tc in tests)
            {
                var (status, stdout, stderr, timeMs, memKb) =
                    await judge.RunOneAsync(sub.Language, sub.SourceCode, tc.InputData);

                var caseStatus = status;

                if (status == "OK")
                {
                    var passed = JudgeService.CheckOutput(tc.ExpectedOutput, stdout);
                    if (!passed) caseStatus = "WA";
                }

                overall = JudgeService.UpdateOverall(overall, caseStatus);

                db.SubmissionCases.Add(new SubmissionCase
                {
                    SubmissionId = sub.Id,
                    TestcaseId = tc.Id,
                    Status = caseStatus,
                    Stdout = tc.IsPublic ? stdout : "",
                    Stderr = tc.IsPublic ? stderr : "",
                    RuntimeMs = timeMs,
                    MemoryKb = memKb,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                });

                if (caseStatus == "CE") break;
            }

            sub.Status = "DONE";
            sub.Verdict = overall;
            sub.UpdatedAt = DateTimeOffset.UtcNow;

            await db.SaveChangesAsync(ct);
        }
    }

