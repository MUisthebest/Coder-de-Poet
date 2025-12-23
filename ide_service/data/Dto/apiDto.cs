namespace IdeService.Dtos;

public record ProblemListItemDto(Guid Id, string Slug, string Title);

public record TestcasePublicDto(Guid Id, int Ord, string Input, string ExpectedOutput);

public record ProblemDetailDto(
    Guid Id,
    string Slug,
    string Title,
    string StatementMd,
    int TimeLimitMs,
    int MemoryLimitMb,
    Dictionary<string, string> Templates,
    List<TestcasePublicDto> Testcases
);

public record RunRequestDto(Guid ProblemId, string Language, string SourceCode);

public record RunCaseResultDto(
    Guid TestcaseId,
    int Ord,
    string Status,     // OK/WA/CE/RE/TLE/ERR
    bool Passed,
    string Stdout,
    string ExpectedOutput,
    string Stderr,
    long TimeMs,
    long MemoryKb
);

public record RunResponseDto(string Overall, List<RunCaseResultDto> Cases);

public record SubmitRequestDto(Guid ProblemId, string Language, string SourceCode);

public record SubmitResponseDto(Guid SubmissionId, string Status);

public record SubmissionCaseDto(
    Guid TestcaseId,
    string Status,
    string Stdout,
    string Stderr,
    long RuntimeMs,
    long MemoryKb
);

public record SubmissionDto(
    Guid Id,
    Guid ProblemId,
    string Language,
    string Status,
    string Verdict,
    List<SubmissionCaseDto> Cases
);
