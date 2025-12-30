using System.Text.Json;

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

        public static string MapExitCode(int code) => code switch
        {
            0 => "OK",
            10 => "CE",
            20 => "TLE",
            30 => "RE",
            124 => "TLE",
            _ => "ERR"
        };

        public async Task<(string status, string stdout, string stderr, long timeMs, long memKb)> RunOneAsync(
            string lang, string source, string input)
        {
            var (code, stdout, stderr, t, mem) =
                await runner.RunBatchAsync(lang, source, MainFileFor(lang), input);

            var status = MapExitCode(code);
            return (status, stdout, stderr, t, mem);
        }
        public async Task<(int exitCode, string stdout, string stderr, long timeMs, long memKb)> RunBatchAsync(
            string lang, string source, string casesJson)
        {
            return await runner.RunBatchAsync(lang, source, MainFileFor(lang), casesJson);
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
