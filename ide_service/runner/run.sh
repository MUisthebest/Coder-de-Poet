#!/usr/bin/env bash
set -euo pipefail

LANG="${LANG:-}"
SRC="${SRC:-}"
TIMEOUT_SEC="${TIMEOUT_SEC:-2}"
CASES_JSON="${CASES_JSON:-}"
cd /work

if [[ -z "$LANG" || -z "$SRC" ]]; then
  echo "Error: LANG and SRC environment variables must be set." >&2
  exit 1
fi

# Debug: show what's in /work
echo "Debug: Contents of /work directory:" >&2
ls -lah /work/ >&2
echo "Debug: Looking for file: $SRC" >&2
echo "Debug: Full path will be: /work/$SRC" >&2

COMPILER_ERR="/tmp/compiler.err"
PROG="/tmp/prog"
JAVA_OUT="/tmp/java_out"
SRC_PATH="/work/$SRC"

compile_cpp() {
  g++ -O2 -std=c++17 -pipe "$SRC_PATH" -o "$PROG" 1>/dev/null 2>"$COMPILER_ERR"
  chmod +x "$PROG"
}

compile_java() {
  if [[ ! -f "$SRC_PATH" ]]; then
    echo "Error: Java source file not found at $SRC_PATH" >&2
    ls -la /work/ >&2
    exit 10
  fi
  rm -rf "$JAVA_OUT"
  mkdir -p "$JAVA_OUT"
  javac -d "$JAVA_OUT" "$SRC_PATH" 1>/dev/null 2>"$COMPILER_ERR"
}

case "$LANG" in
  cpp)    compile_cpp  || { cat "$COMPILER_ERR" >&2; exit 10; } ;;
  java)   compile_java || { cat "$COMPILER_ERR" >&2; exit 10; } ;;
  python) ;; # no compile
  *)
    echo "Error: Unsupported language '$LANG'." >&2
    exit 50
    ;;
esac

if [[ -n "$CASES_JSON" ]]; then
  python3 - <<'PY'
import json, os, subprocess, time

LANG = os.environ["LANG"]
SRC = os.environ["SRC"]
CASES_JSON = os.environ["CASES_JSON"]
TIMEOUT_SEC = int(os.environ.get("TIMEOUT_SEC", "2"))

with open(CASES_JSON, "r", encoding="utf-8") as f:
    cases = json.load(f)["cases"]

def cmd_for():
    if LANG == "cpp":
        return ["/tmp/prog"]
    if LANG == "java":
        return ["java", "-Xms16m", "-Xmx192m", "-XX:+UseSerialGC", "-cp", "/tmp/java_out", "Main"]
    if LANG == "python":
        return ["python3", f"/work/{SRC}"]
    raise RuntimeError("unsupported")

results = []

for c in cases:
    input_data = (c.get("input") or "")
    cmd = cmd_for()

    start = time.perf_counter()
    try:
        p = subprocess.run(
            cmd,
            input=input_data.encode("utf-8", errors="replace"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=TIMEOUT_SEC,
        )
        exit_code = p.returncode
        out_text = p.stdout.decode("utf-8", errors="replace")
        err_text = p.stderr.decode("utf-8", errors="replace")
    except subprocess.TimeoutExpired as ex:
        exit_code = 124  # match your MapExitCode -> TLE
        out_text = (ex.stdout or b"").decode("utf-8", errors="replace")
        err_text = (ex.stderr or b"").decode("utf-8", errors="replace")
        if err_text:
            err_text += "\n"
        err_text += "Error: Time limit exceeded."
    except Exception as ex:
        exit_code = 30  # RE
        out_text = ""
        err_text = f"Error: {type(ex).__name__}: {ex}"

    time_ms = int((time.perf_counter() - start) * 1000)

    results.append({
        "testcaseId": c["testcaseId"],
        "ord": c["ord"],
        "exitCode": exit_code,
        "stdout": out_text,
        "stderr": err_text,
        "timeMs": time_ms,
    })

print(json.dumps({"results": results}, ensure_ascii=False))
PY
  exit 0
fi

set +e
/usr/bin/time -v -o /tmp/time.txt \
  timeout "${TIMEOUT_SEC}" \
  bash -lc "
    exec <&0
    case \"$LANG\" in
      cpp)    \"$PROG\" ;;
      java)   java -Xms16m -Xmx192m -XX:+UseSerialGC -cp \"$JAVA_OUT\" Main ;;
      python) python3 \"/work/$SRC\" ;;
    esac
  " 2>/tmp/runtime.err

CODE=$?
set -e
[[ -f /tmp/time.txt ]] && cat /tmp/time.txt >&2

if [[ $CODE -eq 124 ]]; then
  echo "Error: Time limit exceeded." >&2
  exit 20
elif [[ $CODE -ne 0 ]]; then
  cat /tmp/runtime.err >&2
  exit 30
fi

exit 0
