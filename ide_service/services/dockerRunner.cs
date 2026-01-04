using System.Diagnostics;
using System.Text;

namespace IdeService.Services
{
    public class DockerRunner
    {
        private readonly IConfiguration _cfg;

        public DockerRunner(IConfiguration cfg)
        {
            _cfg = cfg;
        }

        private string Image => _cfg["Runner:Image"] ?? _cfg["RUNNER_IMAGE"] ?? "learnix-sandbox-runner:latest";

        private int TimeoutMs =>
            int.TryParse(_cfg["Runner:TimeoutMs"] ?? _cfg["SANDBOX_TIMEOUT_MS"], out var t) ? t : 2500;

        private string Cpu => _cfg["Runner:Cpu"] ?? _cfg["SANDBOX_CPU"] ?? "1.0";
        private string Mem => _cfg["Runner:Memory"] ?? _cfg["SANDBOX_MEM"] ?? "256m";
        private string Pids => _cfg["Runner:Pids"] ?? _cfg["SANDBOX_PIDS"] ?? "128";

        private int MaxOut =>
            int.TryParse(_cfg["Runner:MaxOutputBytes"] ?? _cfg["MAX_OUTPUT_BYTES"], out var m) ? m : 1_048_576;

        private string? HostSandboxDir => _cfg["HOST_SANDBOX_DIR"];

        private string? ContainerSandboxDir => _cfg["CONTAINER_SANDBOX_DIR"];

        private const int RunnerUid = 10001;
        private const int RunnerGid = 10001;

        private static string ToDockerPath(string path) => Path.GetFullPath(path).Replace("\\", "/");

        private static string NormalizeSource(string s)
        {
            if (string.IsNullOrEmpty(s)) return s;

            // handle JSON-escaped newlines if your API sends them as \n
            if (s.Contains("\\n") || s.Contains("\\r") || s.Contains("\\t") || s.Contains("\\\""))
            {
                s = s.Replace("\\r\\n", "\n")
                     .Replace("\\n", "\n")
                     .Replace("\\r", "\n")
                     .Replace("\\t", "\t")
                     .Replace("\\\"", "\"");
            }

            return s.Replace("\r\n", "\n");
        }

        public async Task<(int exitCode, string stdout, string stderr, long timeMs, long memKb)> RunBatchAsync(
            string language, string sourceCode, string mainFileName, string casesJson)
        {
            if (string.IsNullOrWhiteSpace(language)) throw new ArgumentException("language is required");
            if (string.IsNullOrWhiteSpace(mainFileName)) throw new ArgumentException("mainFileName is required");

            var runId = "ide-run-" + Guid.NewGuid().ToString("N");

            // runDirWrite = path inside ide_service container where we write files
            // runDirMount = path on HOST that docker daemon will mount into sandbox container
            string runDirWrite;
            string runDirMount;

            if (!string.IsNullOrWhiteSpace(HostSandboxDir))
            {
                var hostBase = HostSandboxDir!.TrimEnd('/', '\\');
                var containerBase = (ContainerSandboxDir ?? hostBase).TrimEnd('/', '\\');

                // write here (inside ide_service container)
                runDirWrite = Path.Combine(containerBase, runId);

                // mount from host here (docker daemon sees hostBase)
                runDirMount = (hostBase + "/" + runId).Replace("\\", "/");
            }
            else
            {
                // fallback to /tmp (requires compose to bind /tmp:/tmp if ide_service is containerized)
                runDirWrite = Path.Combine(Path.GetTempPath(), runId);
                runDirMount = ToDockerPath(runDirWrite);
            }

            Directory.CreateDirectory(runDirWrite);

            // Fix permission so sandbox user (uid 10001) can cd /work
            EnsureSandboxDirAccessible(runDirWrite);

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

                // Use ProcessStartInfo with ArgumentList to avoid quoting bugs
                var psi = new ProcessStartInfo("docker")
                {
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false
                };

                // docker run --rm --network=none --cpus ... --memory ... --pids-limit ...
                psi.ArgumentList.Add("run");
                psi.ArgumentList.Add("--rm");
                psi.ArgumentList.Add("--network=none");
                psi.ArgumentList.Add("--cpus"); psi.ArgumentList.Add(Cpu);
                psi.ArgumentList.Add("--memory"); psi.ArgumentList.Add(Mem);
                psi.ArgumentList.Add("--pids-limit"); psi.ArgumentList.Add(Pids);

                psi.ArgumentList.Add("--read-only");
                psi.ArgumentList.Add("--tmpfs");
                psi.ArgumentList.Add("/tmp:rw,noexec,nosuid,size=64m");

                // mount sandbox dir
                psi.ArgumentList.Add("-v");
                psi.ArgumentList.Add($"{runDirMount}:/work:rw");

                // envs for run.sh
                psi.ArgumentList.Add("-e"); psi.ArgumentList.Add($"LANG={language}");
                psi.ArgumentList.Add("-e"); psi.ArgumentList.Add($"SRC={mainFileName}");
                psi.ArgumentList.Add("-e"); psi.ArgumentList.Add($"TIMEOUT_SEC={timeoutSec}");
                psi.ArgumentList.Add("-e"); psi.ArgumentList.Add("CASES_JSON=/work/cases.json");

                // image
                psi.ArgumentList.Add(Image);

                Console.Error.WriteLine("[docker] " + RenderCommandForLog(psi));

                var sw = Stopwatch.StartNew();
                using var p = Process.Start(psi) ?? throw new Exception("Failed to start docker process.");

                var cts = new CancellationTokenSource(TimeoutMs + 800);
                var stdoutTask = p.StandardOutput.ReadToEndAsync();
                var stderrTask = p.StandardError.ReadToEndAsync();

                while (!p.HasExited && !cts.IsCancellationRequested)
                    await Task.Delay(30);

                if (!p.HasExited)
                {
                    try { p.Kill(entireProcessTree: true); } catch { /* ignore */ }
                }

                var stdout = await stdoutTask;
                var stderr = await stderrTask;
                sw.Stop();

                if (stdout.Length > MaxOut) stdout = stdout[..MaxOut];
                if (stderr.Length > MaxOut) stderr = stderr[..MaxOut];

                // If docker is killed by us due to timeout -> map to TLE-ish exit code (20)
                // But your existing MapExitCode uses 20 for TLE; here docker itself may return 137/143.
                // We'll keep raw exit and let your higher-level mapping decide.
                var exit = p.HasExited ? p.ExitCode : 30;

                var memKb = OutputNormalize.ParseMaxRssKb(stderr);

                return (exit, stdout, stderr, sw.ElapsedMilliseconds, memKb);
            }
            finally
            {
                try { Directory.Delete(runDirWrite, recursive: true); } catch { /* ignore */ }
            }
        }

        private static string RenderCommandForLog(ProcessStartInfo psi)
        {
            // Only for logging; do not include secrets
            var sb = new StringBuilder();
            sb.Append(psi.FileName);
            foreach (var a in psi.ArgumentList)
            {
                sb.Append(' ');
                if (a.Contains(' ') || a.Contains('"'))
                    sb.Append('"').Append(a.Replace("\"", "\\\"")).Append('"');
                else
                    sb.Append(a);
            }
            return sb.ToString();
        }

        private static void EnsureSandboxDirAccessible(string dir)
        {
            // Most reliable: chown to runner uid/gid + chmod 777
            // Needs ide_service container to have chown/chmod (Debian/Ubuntu base has it)
            TryExec("chmod", $"-R 777 \"{dir}\"");
            // Optional: chown (if container allows). If filesystem doesn't support, ignore.
            TryExec("chown", $"-R {RunnerUid}:{RunnerGid} \"{dir}\"");
            TryExec("chmod", $"-R 777 \"{dir}\"");
        }

        private static void TryExec(string file, string args)
        {
            try
            {
                var psi = new ProcessStartInfo(file, args)
                {
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false
                };
                using var p = Process.Start(psi);
                p?.WaitForExit(1500);
            }
            catch
            {
                // swallow
            }
        }
    }
}
