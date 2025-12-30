import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { submitSolution, fetchProblemDetail } from "../../services/apiCoding";

function defaultLangFromTemplates(templates) {
  if (!templates) return "cpp";
  if (templates.cpp) return "cpp";
  if (templates.java) return "java";
  if (templates.python) return "python";
  return Object.keys(templates)[0] || "cpp";
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
      {children}
    </span>
  );
}

function SkeletonLine({ wide = false }) {
  return (
    <div className={`h-4 rounded bg-white/10 animate-pulse ${wide ? "w-full" : "w-2/3"}`} />
  );
}

export default function ProblemDetailPage() {
  const { problemId } = useParams();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [lang, setLang] = useState("cpp");
  const [code, setCode] = useState("");

  const [activeCaseId, setActiveCaseId] = useState(null);

  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null); // { overall, cases:[...] }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        setRunResult(null);

        const data = await fetchProblemDetail(problemId);

        if (alive) {
          setProblem(data);

          const initialLang = defaultLangFromTemplates(data.templates);
          setLang(initialLang);
          setCode(data.templates?.[initialLang] || "");

          const tcs = data?.testcases || [];
          setActiveCaseId(tcs.length ? tcs[0].id : null);
        }
      } catch (e) {
        if (alive) setErr(e?.message || "Failed to load problem detail");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [problemId]);

  // Change language => load template
  useEffect(() => {
    if (!problem?.templates) return;
    setCode(problem.templates?.[lang] || "");
  }, [lang, problem]);

  const testcases = problem?.testcases || [];

  useEffect(() => {
    if (!testcases.length) {
      setActiveCaseId(null);
      return;
    }
    if (activeCaseId == null) {
      setActiveCaseId(testcases[0].id);
      return;
    }
    const exists = testcases.some((tc) => tc.id === activeCaseId);
    if (!exists) setActiveCaseId(testcases[0].id);
  }, [testcases, activeCaseId]);

  const current = useMemo(
    () => testcases.find((tc) => tc.id === activeCaseId) || null,
    [testcases, activeCaseId]
  );

  const resultsMap = useMemo(() => {
    const map = new Map();
    for (const c of runResult?.cases || []) map.set(c.testcaseId, c);
    return map;
  }, [runResult]);

  const currentResult = current ? resultsMap.get(current.id) : null;

  const metaText = useMemo(() => {
    if (!problem) return "";
    return `${problem.timeLimitMs} ms • ${problem.memoryLimitMb} MB`;
  }, [problem]);

  async function handleRun() {
    if (!current) return;

    try {
      setRunning(true);
      const data = await submitSolution(problemId, code, lang, current.input);

      setRunResult(data);
    } catch (e) {
      setRunResult({
        overall: "ERR",
        cases: [
          {
            testcaseId: current.id,
            ord: current.ord,
            status: "ERR",
            stdout: "",
            stderr: e?.message || "Run error",
            timeMs: 0,
            memoryKb: 0,
          },
        ],
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="mx-auto max-w-6xl h-full px-4 py-4 flex flex-col">
        {/* Topbar */}
        <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-700 to-sky-400 font-extrabold">
              L
            </div>
            <div>
              <div className="text-lg font-bold">
                {loading ? "Loading..." : problem?.title || "Problem"}
              </div>
              <div className="text-sm text-slate-400">
                <span>{problem?.slug || ""}</span>
                {problem ? <span className="mx-2">|</span> : null}
                {problem ? <span>{metaText}</span> : null}
              </div>
            </div>
          </div>

          <Link
            to="/ide"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-white/20"
          >
            Back
          </Link>
        </div>

        {err ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
            <div className="font-semibold text-red-200">Couldn’t load problem</div>
            <div className="mt-1 text-sm text-red-300">{err}</div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)_minmax(0,28vh)] gap-4">
            {/* TOP: 2 columns */}
            <div className="min-h-0 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* LEFT: Description */}
              <div className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 flex flex-col">
                <div className="shrink-0 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-200">Description</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill>Time {problem?.timeLimitMs ?? "-"}ms</Pill>
                    <Pill>Mem {problem?.memoryLimitMb ?? "-"}MB</Pill>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto px-4 py-4">
                  {loading ? (
                    <div className="space-y-3">
                      <SkeletonLine wide />
                      <SkeletonLine wide />
                      <SkeletonLine />
                      <SkeletonLine wide />
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>
                        {(problem?.statementMd || "").replace(/\\n/g, "\n")}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Code editor */}
              <div className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 flex flex-col">
                <div className="shrink-0 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-200">Code</div>

                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                      value={lang}
                      onChange={(e) => setLang(e.target.value)}
                      disabled={loading || running}
                    >
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                      <option value="python">Python</option>
                    </select>

                    <button
                      className="rounded-xl border border-blue-400/40 bg-blue-400/15 px-3 py-2 text-sm hover:border-blue-300/60 disabled:opacity-40"
                      disabled={loading || running || !current}
                      onClick={handleRun}
                    >
                      {running ? "Running..." : "Run"}
                    </button>

                    <button
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:border-white/20 disabled:opacity-40"
                      disabled={loading || running || !problem?.templates}
                      onClick={() => setCode(problem?.templates?.[lang] || "")}
                      title="Reset to template"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 p-4">
                  {loading ? (
                    <div className="space-y-3">
                      <SkeletonLine wide />
                      <SkeletonLine wide />
                      <SkeletonLine wide />
                    </div>
                  ) : (
                    <textarea
                      className="h-full w-full resize-none rounded-2xl border border-white/10 bg-slate-950/40 p-3 font-mono text-[13px] leading-6 text-slate-100 outline-none"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      spellCheck={false}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* BOTTOM: Testcases */}
            <div className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 flex flex-col">
              <div className="shrink-0 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="text-sm font-semibold text-slate-200">Testcases</div>
                <div className="text-sm text-slate-400">{testcases.length} cases</div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto px-4 py-3">
                {loading ? (
                  <div className="space-y-3">
                    <SkeletonLine wide />
                    <SkeletonLine wide />
                  </div>
                ) : testcases.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">No testcases</div>
                ) : (
                  <>
                    {/* Tabs */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {testcases.map((tc) => (
                        <button
                          key={tc.id}
                          onClick={() => setActiveCaseId(tc.id)} 
                          className={[
                            "rounded-full border px-3 py-1 text-xs",
                            tc.id === activeCaseId
                              ? "border-blue-400/40 bg-blue-400/15 text-slate-100"
                              : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20",
                          ].join(" ")}
                        >
                          Case {tc.ord}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold text-slate-200">
                          Input
                        </div>
                        <pre className="max-h-[90px] overflow-auto whitespace-pre-wrap break-words px-4 py-2 font-mono text-xs text-slate-100">
                          {current?.input || ""}
                        </pre>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold text-slate-200">
                          Expected
                        </div>
                        <pre className="max-h-[90px] overflow-auto whitespace-pre-wrap break-words px-4 py-2 font-mono text-xs text-slate-100">
                          {current?.expectedOutput || ""}
                        </pre>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                          <div className="text-xs font-semibold text-slate-200">Output</div>
                          <div className="text-xs text-slate-400">
                            {runResult?.overall ? `Overall: ${runResult.overall}` : ""}
                          </div>
                        </div>

                        <div className="px-4 py-2">
                          {running ? (
                            <div className="text-xs text-slate-400">Running...</div>
                          ) : runResult ? (
                            (() => {
                              const c = currentResult; 
                              const status = c?.status || runResult.overall || "—";
                              const stderr = c?.stderr || "";
                              const stdout = c?.stdout || "";
                              const timeMs = c?.timeMs;
                              const memKb = c?.memoryKb;

                              return (
                                <>
                                  <div className="mb-1 text-xs text-slate-400">Status: {status}</div>
                                  <pre
                                    className={`max-h-[90px] overflow-auto whitespace-pre-wrap break-words font-mono text-xs ${
                                      stderr ? "text-red-300" : "text-slate-100"
                                    }`}
                                  >
                                    {stderr || stdout || ""}
                                  </pre>
                                  {(timeMs != null || memKb != null) && (
                                    <div className="mt-1 text-xs text-slate-400">
                                      {timeMs != null ? `Time: ${timeMs} ms` : ""}
                                      {timeMs != null && memKb != null ? " | " : ""}
                                      {memKb != null ? `Mem: ${memKb} KB` : ""}
                                    </div>
                                  )}
                                </>
                              );
                            })()
                          ) : (
                            <div className="text-xs text-slate-400">Click Run to execute.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
