using System.Diagnostics;

namespace IdeService.Services
{
    public class DockerRunner(IConfiguration cfg)
    {
        private string Image => cfg["Runner:Image"] ?? cfg["RUNNER_IMAGE"] ?? "learnix-runner:latest";
        private int TimeoutMs => int.TryParse(cfg["Runner:TimeoutMs"] ?? cfg["SANDBOX_TIMEOUT_MS"], out var t) ? t : 2500;

        private string Cpu => cfg["Runner:Cpu"] ?? cfg["SANDBOX_CPU"] ?? "1.0";
        private string Mem => cfg["Runner:Memory"] ?? cfg["SANDBOX_MEM"] ?? "256m";
        private string Pids => cfg["Runner:Pids"] ?? cfg["SANDBOX_PIDS"] ?? "128";
        private int MaxOut => int.TryParse(cfg["Runner:MaxOutputBytes"] ?? cfg["MAX_OUTPUT_BYTES"], out var m) ? m : 1_048_576;

        private string? HostSandboxDir => cfg["HOST_SANDBOX_DIR"];            // host path Docker daemon can see
        private string? ContainerSandboxDir => cfg["CONTAINER_SANDBOX_DIR"];  // same folder mounted inside ide_api container

        private static string ToDockerPath(string path) => Path.GetFullPath(path).Replace("\\", "/");

        private static string NormalizeSource(string s)
        {
            if (string.IsNullOrEmpty(s)) return s;

            // If it contains literal backslash-n, unescape it
            if (s.Contains("\\n") || s.Contains("\\r") || s.Contains("\\t") || s.Contains("\\\""))
            {
                s = s.Replace("\\r\\n", "\n")
                     .Replace("\\n", "\n")
                     .Replace("\\r", "\n")
                     .Replace("\\t", "\t")
                     .Replace("\\\"", "\"");
            }

            // Normalize line endings (optional but safe)
            return s.Replace("\r\n", "\n");
        }

        public async Task<(int exitCode, string stdout, string stderr, long timeMs, long memKb)> RunBatchAsync(
            string language, string sourceCode, string mainFileName, string casesJson)
        {
            var runId = "ide-run-" + Guid.NewGuid().ToString("N");

            string runDirWrite;
            string runDirMount;

            if (!string.IsNullOrWhiteSpace(HostSandboxDir))
            {
                var hostBase = HostSandboxDir!.TrimEnd('/', '\\');
                var containerBase = (ContainerSandboxDir ?? hostBase).TrimEnd('/', '\\');

                runDirWrite = Path.Combine(containerBase, runId);
                runDirMount = (hostBase + "/" + runId).Replace("\\", "/");
            }
            else
            {
                runDirWrite = Path.Combine(Path.GetTempPath(), runId);
                runDirMount = ToDockerPath(runDirWrite);
            }

            Directory.CreateDirectory(runDirWrite);

            try
            {
                var sourcePath = Path.Combine(runDirWrite, mainFileName);
                var casesPath = Path.Combine(runDirWrite, "cases.json");

                await File.WriteAllTextAsync(sourcePath, NormalizeSource(sourceCode));
                await File.WriteAllTextAsync(casesPath, casesJson);

                if (!File.Exists(sourcePath))
                    throw new Exception($"Source not created: {sourcePath}");
                if (!File.Exists(casesPath))
                    throw new Exception($"cases.json not created: {casesPath}");

                var timeoutSec = Math.Max(1, (int)Math.Ceiling(TimeoutMs / 1000.0));

                var args =
                    "run --rm " +
                    "--network=none " +
                    $"--cpus {Cpu} --memory {Mem} --pids-limit {Pids} " +
                    "--read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m " +
                    $"-v \"{runDirMount}:/work:rw\" " +
                    $"-e LANG={language} -e SRC={mainFileName} -e TIMEOUT_SEC={timeoutSec} -e CASES_JSON=/work/cases.json " +
                    $"{Image}";

                Console.Error.WriteLine("[docker] " + args);

                var psi = new ProcessStartInfo("docker", args)
                {
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false
                };

                var sw = Stopwatch.StartNew();
                using var p = Process.Start(psi)!;

                var cts = new CancellationTokenSource(TimeoutMs + 500);
                var stdoutTask = p.StandardOutput.ReadToEndAsync();
                var stderrTask = p.StandardError.ReadToEndAsync();

                while (!p.HasExited && !cts.IsCancellationRequested)
                    await Task.Delay(30);

                if (!p.HasExited)
                {
                    try { p.Kill(entireProcessTree: true); } catch { }
                }

                var stdout = await stdoutTask;
                var stderr = await stderrTask;
                sw.Stop();

                if (stdout.Length > MaxOut) stdout = stdout[..MaxOut];
                if (stderr.Length > MaxOut) stderr = stderr[..MaxOut];

                var exit = p.HasExited ? p.ExitCode : 30;
                var memKb = OutputNormalize.ParseMaxRssKb(stderr);

                return (exit, stdout, stderr, sw.ElapsedMilliseconds, memKb);
            }
            finally
            {
                try { Directory.Delete(runDirWrite, recursive: true); } catch { }
            }
        }
    }
}
