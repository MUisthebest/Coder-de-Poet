using Microsoft.EntityFrameworkCore;
namespace IdeService.Data;

public class IdeDbContext(DbContextOptions<IdeDbContext> options) : DbContext(options)
{
    public DbSet<Problem> Problems => Set<Problem>();
    public DbSet<ProblemTemplate> ProblemTemplates => Set<ProblemTemplate>();
    public DbSet<Testcase> Testcases => Set<Testcase>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<SubmissionCase> SubmissionCases => Set<SubmissionCase>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Problem>(e =>
        {
            e.ToTable("problems");
            e.HasKey(x => x.Id);

            e.Property(x => x.StatementMd).HasColumnName("statement_md");
            e.Property(x => x.TimeLimitMs).HasColumnName("time_limit_ms");
            e.Property(x => x.MemoryLimitMb).HasColumnName("memory_limit_mb");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasIndex(x => x.Slug).IsUnique();

            e.HasMany(x => x.Templates).WithOne(t => t.Problem).HasForeignKey(t => t.ProblemId);
            e.HasMany(x => x.Testcases).WithOne(t => t.Problem).HasForeignKey(t => t.ProblemId);
        });

        b.Entity<ProblemTemplate>(e =>
        {
            e.ToTable("problem_templates");
            e.HasKey(x => x.Id);

            e.Property(x => x.ProblemId).HasColumnName("problem_id");
            e.Property(x => x.MainFilename).HasColumnName("main_filename");
            e.Property(x => x.StarterCode).HasColumnName("starter_code");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasIndex(x => new { x.ProblemId, x.Language }).IsUnique();
        });

        b.Entity<Testcase>(e =>
        {
            e.ToTable("testcases");
            e.HasKey(x => x.Id);

            e.Property(x => x.ProblemId).HasColumnName("problem_id");
            e.Property(x => x.IsPublic).HasColumnName("is_public");
            e.Property(x => x.InputData).HasColumnName("input_data");
            e.Property(x => x.ExpectedOutput).HasColumnName("expected_output");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasIndex(x => new { x.ProblemId, x.Ord }).IsUnique();
        });

        b.Entity<Submission>(e =>
        {
            e.ToTable("submissions");
            e.HasKey(x => x.Id);

            e.Property(x => x.ProblemId).HasColumnName("problem_id");
            e.Property(x => x.SourceCode).HasColumnName("source_code");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasIndex(x => new { x.Status, x.CreatedAt }).HasDatabaseName("idx_submissions_status_created");

            e.HasMany(x => x.Cases).WithOne(c => c.Submission).HasForeignKey(c => c.SubmissionId);
        });

        b.Entity<SubmissionCase>(e =>
        {
            e.ToTable("submission_cases");
            e.HasKey(x => x.Id);

            e.Property(x => x.SubmissionId).HasColumnName("submission_id");
            e.Property(x => x.TestcaseId).HasColumnName("testcase_id");
            e.Property(x => x.RuntimeMs).HasColumnName("runtime_ms");
            e.Property(x => x.MemoryKb).HasColumnName("memory_kb");
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");

            e.HasIndex(x => new { x.SubmissionId, x.TestcaseId }).IsUnique();
        });

        base.OnModelCreating(b);
    }
}
