namespace IdeService.Services;

public class JudgeService(DockerRunner runner)
{
    public static string MainFileFor(string lang) => lang switch
    {
        "cpp" => "main.cpp",
        "java" => "Main.java",
        "python" => "main.py",
        _ => throw new ArgumentOutOfRangeException(nameof(lang))
    };

    public async Task<(string status, string stdout, string stderr, long timeMs, long memKb)> RunOneAsync(
        string lang, string source, string input)
    {
        var (code, stdout, stderr, t, mem) =
            await runner.RunAsync(lang, source, MainFileFor(lang), input);

        var status = code switch
        {
            0 => "OK",
            10 => "CE",
            20 => "RE",
            30 => "TLE",
            _ => "ERR"
        };

        return (status, stdout, stderr, t, mem);
    }

    public static bool CheckOutput(string expected, string got)
        => OutputNormalize.Equal(expected, got);

    public static string UpdateOverall(string overall, string caseStatus)
    {
        if (overall != "AC") return overall;
        return caseStatus switch
        {
            "OK" => "AC",
            "WA" => "WA",
            "CE" => "CE",
            "RE" => "RE",
            "TLE" => "TLE",
            _ => "ERR"
        };
    }
}
