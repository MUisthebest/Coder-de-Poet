#!/usr/bin/env bash
set -euo pipefail

# Ensure we can access workdir
cd /work || { echo "Cannot access /work" >&2; exit 1; }

LANG="${LANG:?}"
SRC="${SRC:?}"
TIMEOUT_SEC="${TIMEOUT_SEC:-2}"
CASES_JSON="${CASES_JSON:?}"

COMPILER_ERR="/tmp/compiler.err"
PROG="/tmp/prog"
JAVA_OUT="/tmp/java_out"
SRC_PATH="/work/$SRC"

compile_cpp() {
  g++ -O2 -std=c++17 -pipe "$SRC_PATH" -o "$PROG" 1>/dev/null 2>"$COMPILER_ERR"
  chmod +x "$PROG"
}

compile_java() {
  rm -rf "$JAVA_OUT"
  mkdir -p "$JAVA_OUT"
  javac -d "$JAVA_OUT" "$SRC_PATH" 1>/dev/null 2>"$COMPILER_ERR"
}

case "$LANG" in
  cpp)
    compile_cpp || { cat "$COMPILER_ERR" >&2; exit 10; }
    ;;
  java)
    compile_java || { cat "$COMPILER_ERR" >&2; exit 10; }
    ;;
  python)
    # no compile
    ;;
  *)
    echo "Error: Unsupported language '$LANG'." >&2
    exit 50
    ;;
esac

python3 - <<'PY'
import json, os, subprocess, time

LANG = os.environ["LANG"]
SRC = os.environ["SRC"]
CASES_JSON = os.environ["CASES_JSON"]
TL = int(os.environ.get("TIMEOUT_SEC", "2"))

with open(CASES_JSON, "r", encoding="utf-8") as f:
    cases = json.load(f)["cases"]

def cmd():
    if LANG == "cpp":
        return ["/tmp/prog"]
    if LANG == "java":
        return ["java", "-Xms16m", "-Xmx192m", "-XX:+UseSerialGC", "-cp", "/tmp/java_out", "Main"]
    if LANG == "python":
        return ["python3", f"/work/{SRC}"]
    raise RuntimeError("unsupported")

results = []
for c in cases:
    start = time.perf_counter()
    try:
        p = subprocess.run(
            cmd(),
            input=(c.get("input") or "").encode("utf-8", errors="replace"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=TL,
        )
        code = p.returncode
        out = p.stdout.decode("utf-8", errors="replace")
        err = p.stderr.decode("utf-8", errors="replace")
    except subprocess.TimeoutExpired as ex:
        code = 124
        out = (ex.stdout or b"").decode("utf-8", errors="replace")
        err = (ex.stderr or b"").decode("utf-8", errors="replace")
        if err:
            err += "\n"
        err += "Error: Time limit exceeded."
    except Exception as ex:
        code = 30
        out = ""
        err = f"Error: {type(ex).__name__}: {ex}"

    results.append({
        "testcaseId": c["testcaseId"],
        "ord": c["ord"],
        "exitCode": code,
        "stdout": out,
        "stderr": err,
        "timeMs": int((time.perf_counter() - start) * 1000),
    })

print(json.dumps({"results": results}, ensure_ascii=False))
PY
