#!/usr/bin/env bash
set -euo pipefail

LANG="${LANG:-}"
SRC="${SRC:-}"
IN="${IN:-/work/input.txt}"
TIMEOUT_SEC="${TIMEOUT_SEC:-2}"

cd /work

if [[ -z "$LANG" || -z "$SRC" ]]; then
  echo "Error: LANG and SRC environment variables must be set." >&2
  exit 1
fi

compile_cpp() {
    g++ -O2 -std=c++17 "$SRC" -pipe "$SRC" -o prog 1>/dev/null 2>compiler.err;
}

compile_java() {
    javac "$SRC" 1>/dev/null 2>compiler.err;
}

run_cpp() {
    ./prog < "$IN"
}

run_java() {
    java -Xmx192m -cp . Main < "$IN";
}

run_python() {
    python3 "$SRC" < "$IN";
}

case "$LANG" in 
    "cpp") compile_cpp || { cat compile.err >&2; exit 10; } ;;
    "java") compile_java || { cat compile.err >&2; exit 10; } ;;
    "python") ;;  # No compilation needed for Python
    *)
        echo "Error: Unsupported language '$LANG'." >&2
        exit 50
        ;;
    esac

set +e
TIME_INFO=$(
    timeout "${TIMEOUT_SEC}" bash -lc \
        "/usr/bin/time -v bash -lc case \"$LANG\" in cpp) run_cpp ;; java) run_java ;; python) run_python ;; esac" 2>&1 1>/tmp>prog.out
)

CODE=$?
set -e

cat /tmp>prog.out
if [[ $CODE -eq 124 ]]; then
    echo "Error: Time limit exceeded." >&2
    exit 20
elif [[ $CODE -ne 0 ]]; then
    echo "Error: Runtime error." >&2
    exit 30
fi

echo "$TIME_INFO" >&2
exit 0