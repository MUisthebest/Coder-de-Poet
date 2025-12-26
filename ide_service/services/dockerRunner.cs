using System.Diagnostics;

namespace IdeService.Services
{
    public class DockerRunner(IConfiguration cfg)
    {
        private string Image => cfg["Runner:Image"] ?? cfg["RUNNER_IMAGE"] ?? "learnix-runner:latest";
        private int TimeoutMs => int.TryParse(cfg["Runner:TimeoutMs"] ?? cfg["SANDBOX_TIMEOUT_MS"], out var t) ? t : 2500;

        private string CpuDefault => cfg["Runner:Cpu"] ?? cfg["SANDBOX_CPU"] ?? "1.0";
        private string MemDefault => cfg["Runner:Memory"] ?? cfg["SANDBOX_MEM"] ?? "256m";

        private string CpuPython => cfg["Runner:CpuPython"] ?? cfg["SANDBOX_CPU_PY"] ?? CpuDefault;
        private string MemPython => cfg["Runner:MemPython"] ?? cfg["SANDBOX_MEM_PY"] ?? MemDefault;

        private string CpuCompiled => cfg["Runner:CpuCompiled"] ?? cfg["SANDBOX_CPU_COMPILED"] ?? "2.0";
        private string MemCompiled => cfg["Runner:MemCompiled"] ?? cfg["SANDBOX_MEM_COMPILED"] ?? "512m";

        private string Pids => cfg["Runner:Pids"] ?? cfg["SANDBOX_PIDS"] ?? "128";
        private int MaxOut => int.TryParse(cfg["Runner:MaxOutputBytes"] ?? cfg["MAX_OUTPUT_BYTES"], out var m) ? m : 1_048_576;

        private (string cpu, string mem) GetLimits(string language) => language switch
        {
            "python" => (CpuPython, MemPython),
            "java" or "cpp" => (CpuCompiled, MemCompiled),
            _ => (CpuDefault, MemDefault)
        };

        public async Task<(int exitCode, string stdout, string stderr, long timeMs, long memKb)> RunAsync(
            string language, string sourceCode, string mainFileName, string casesJson /* <- đổi tên cho đúng */, string? _unused = null)
        {
            var hostBaseDir = (cfg["HOST_SANDBOX_DIR"] ?? throw new Exception("HOST_SANDBOX_DIR not configured"))
                .TrimEnd('/', '\\').Replace("\\", "/");

            var containerBase = (cfg["CONTAINER_SANDBOX_DIR"] ?? "/sandbox_host").TrimEnd('/');

            var runId = "ide-run-" + Guid.NewGuid().ToString("N");
            var runDirInContainer = $"{containerBase}/{runId}";
            var runDirOnHost = $"{hostBaseDir}/{runId}";

            Directory.CreateDirectory(runDirInContainer);

            try
            {
                await File.WriteAllTextAsync(Path.Combine(runDirInContainer, mainFileName), sourceCode);

                await File.WriteAllTextAsync(Path.Combine(runDirInContainer, "cases.json"), casesJson);

                var timeoutSec = Math.Max(1, (int)Math.Ceiling(TimeoutMs / 1000.0));
                var (cpu, mem) = GetLimits(language);

                var args =
                    "run --rm " +
                    "--network=none " +
                    $"--cpus {cpu} --memory {mem} --pids-limit {Pids} " +
                    "--read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m " +
                    $"-v \"{runDirOnHost}:/work:rw\" " +
                    $"-e LANG={language} -e SRC={mainFileName} -e TIMEOUT_SEC={timeoutSec} -e CASES_JSON=/work/cases.json " +
                    $"{Image}";

                var psi = new ProcessStartInfo("docker", args)
                {
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false
                };

                var sw = Stopwatch.StartNew();
                Console.Error.WriteLine("[docker] " + args);

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
                try { Directory.Delete(runDirInContainer, recursive: true); } catch { }
            }
        }
    }
}
