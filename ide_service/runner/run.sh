#!/usr/bin/env bash
set -euo pipefail

LANG="${LANG:?}"
SRC="${SRC:?}"
TIMEOUT_SEC="${TIMEOUT_SEC:-2}"
CASES_JSON="${CASES_JSON:?}"

cd /work

COMPILER_ERR="/tmp/compiler.err"
PROG="/tmp/prog"
JAVA_OUT="/tmp/java_out"
SRC_PATH="/work/$SRC"

compile_cpp() {
  g++ -O2 -std=c++17 "$SRC_PATH" -o "$PROG" 2>"$COMPILER_ERR"
}

compile_java() {
  mkdir -p "$JAVA_OUT"
  javac -d "$JAVA_OUT" "$SRC_PATH" 2>"$COMPILER_ERR"
}

case "$LANG" in
  cpp)    compile_cpp  || exit 10 ;;
  java)   compile_java || exit 10 ;;
  python) ;;
  *) exit 50 ;;
esac

python3 - <<'PY'
import json, subprocess, time, os

LANG=os.environ["LANG"]
SRC=os.environ["SRC"]
CASES_JSON=os.environ["CASES_JSON"]
TL=int(os.environ.get("TIMEOUT_SEC","2"))

cases=json.load(open(CASES_JSON))["cases"]

def cmd():
    if LANG=="cpp": return ["/tmp/prog"]
    if LANG=="java": return ["java","-cp","/tmp/java_out","Main"]
    if LANG=="python": return ["python3",SRC]

results=[]
for c in cases:
    start=time.perf_counter()
    try:
        p=subprocess.run(
            cmd(),
            input=(c.get("input") or "").encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=TL
        )
        code=p.returncode
        out=p.stdout.decode()
        err=p.stderr.decode()
    except subprocess.TimeoutExpired:
        code=124; out=""; err="TLE"

    results.append({
        "testcaseId": c["testcaseId"],
        "ord": c["ord"],
        "exitCode": code,
        "stdout": out,
        "stderr": err,
        "timeMs": int((time.perf_counter()-start)*1000)
    })

print(json.dumps({"results":results}, ensure_ascii=False))
PY
