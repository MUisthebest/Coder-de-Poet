using System;
using System.Collections.Generic;

namespace IdeService.Data
{
    public class Problem
    {
        public Guid Id { get; set; }
        public string Slug { get; set; } = "";
        public string Title { get; set; } = "";
        public string StatementMd { get; set; } = "";
        public int TimeLimitMs { get; set; } = 2000;
        public int MemoryLimitMb { get; set; } = 256;

        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }

        public List<ProblemTemplate> Templates { get; set; } = new();
        public List<Testcase> Testcases { get; set; } = new();
    }

    public class ProblemTemplate
    {
        public Guid Id { get; set; }
        public Guid ProblemId { get; set; }
        public string Language { get; set; } = "";
        public string MainFilename { get; set; } = "";
        public string StarterCode { get; set; } = "";

        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }

        public Problem Problem { get; set; } = null!;
    }

    public class Testcase
    {
        public Guid Id { get; set; }
        public Guid ProblemId { get; set; }
        public bool IsPublic { get; set; } = true;
        public int Ord { get; set; }
        public string InputData { get; set; } = "";
        public string ExpectedOutput { get; set; } = "";

        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }

        public Problem Problem { get; set; } = null!;
    }

    public class Submission
    {
        public Guid Id { get; set; }
        public Guid ProblemId { get; set; }
        public string Language { get; set; } = "";
        public string SourceCode { get; set; } = "";
        public string Status { get; set; } = "PENDING";
        public string Verdict { get; set; } = "PENDING";

        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }

        public Problem Problem { get; set; } = null!;
        public List<SubmissionCase> Cases { get; set; } = new();
    }

    public class SubmissionCase
    {
        public Guid Id { get; set; }
        public Guid SubmissionId { get; set; }
        public Guid TestcaseId { get; set; }

        public string Status { get; set; } = "ERR";
        public string Stdout { get; set; } = "";
        public string Stderr { get; set; } = "";
        public long RuntimeMs { get; set; }
        public long MemoryKb { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }

        public Submission Submission { get; set; } = null!;
        public Testcase Testcase { get; set; } = null!;
    }
}
