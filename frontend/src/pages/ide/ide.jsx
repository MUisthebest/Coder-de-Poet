/*
  ProblemList page (LeetCode-style) - Light Mode
  - Fetch: fetchProblems()
  - Search: title/slug
  - Sort: title/slug/id
  - Pagination: 10 per page
  - Click title -> /problems/:id
*/
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProblems } from "../../services/apiCoding";

const PAGE_SIZE = 10;

function normalizeString(s) {
    return (s || "").toLowerCase().trim();
}

function compare(a, b, key, dir) {
    const av = normalizeString(a?.[key]);
    const bv = normalizeString(b?.[key]);
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
}

function SkeletonRow({ i }) {
    return (
        <tr key={i} className="border-b border-gray-200">
            <td className="py-3 px-4">
                <div className="h-6 w-14 rounded-full bg-gray-200 animate-pulse" />
            </td>
            <td className="py-3 px-4">
                <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
            </td>
            <td className="py-3 px-4">
                <div className="h-4 w-64 rounded bg-gray-200 animate-pulse" />
            </td>
            <td className="py-3 px-4">
                <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
            </td>
            <td className="py-3 px-4">
                <div className="h-4 w-72 rounded bg-gray-200 animate-pulse" />
            </td>
        </tr>
    );
}

function SortCaret({ active, dir }) {
    if (!active) return <span className="ml-2 text-gray-400">^v</span>;
    return <span className="ml-2 text-gray-800">{dir === "asc" ? "^" : "v"}</span>;
}

export default function ProblemList() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState("title");
    const [sortDir, setSortDir] = useState("asc");
    const [page, setPage] = useState(1);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setErr("");

                const data = await fetchProblems();
                if (!Array.isArray(data)) throw new Error("API did not return an array");
                if (alive) setProblems(data);
            } catch (e) {
                if (alive) setErr(e?.message || "Failed to load problems");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => setPage(1), [query, sortKey, sortDir]);

    const filteredSorted = useMemo(() => {
        const q = normalizeString(query);

        const filtered = q
            ? problems.filter((p) => {
                const t = normalizeString(p?.title);
                const s = normalizeString(p?.slug);
                return t.includes(q) || s.includes(q);
            })
            : problems.slice();

        filtered.sort((a, b) => compare(a, b, sortKey, sortDir));
        return filtered;
    }, [problems, query, sortKey, sortDir]);

    const total = filteredSorted.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), totalPages);

    const pageItems = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE;
        return filteredSorted.slice(start, start + PAGE_SIZE);
    }, [filteredSorted, safePage]);

    function toggleSort(key) {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
            setSortKey(key);
            setSortDir("asc");
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Header */}
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 font-extrabold text-white">
                            L
                        </div>
                        <div>
                            <div className="text-lg font-bold text-gray-900">Problemset</div>
                            <div className="text-sm text-gray-600">LeetCode-style list from your API</div>
                        </div>
                    </div>

                    <div className="w-full sm:w-[380px]">
                        <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
                            <span className="text-gray-500">Search</span>
                            <input
                                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                                placeholder="Search by title or slug..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Card */}
                <div className="overflow-hidden w-full rounded-2xl border border-gray-200 bg-white shadow-lg max-h-[85vh]">
                    {/* Card header */}
                    <div className="flex flex-col w-full gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-600">
                            {loading ? "Loading..." : `${total} problems`}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
                                onClick={() => setPage(1)}
                                disabled={safePage === 1 || loading}
                                title="First page"
                            >
                                {"<<"}
                            </button>
                            <button
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={safePage === 1 || loading}
                                title="Previous page"
                            >
                                {"<"}
                            </button>

                            <span className="text-sm text-gray-600">
                                Page <b className="text-gray-900">{safePage}</b> / {totalPages}
                            </span>

                            <button
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages || loading}
                                title="Next page"
                            >
                                {">"}
                            </button>
                            <button
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
                                onClick={() => setPage(totalPages)}
                                disabled={safePage === totalPages || loading}
                                title="Last page"
                            >
                                {">>"}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {err ? (
                        <div className="px-4 py-4">
                            <div className="font-semibold text-red-600">Couldn't load problems</div>
                            <div className="mt-1 text-sm text-red-500">
                                {err}
                                <div className="mt-2 text-gray-600">
                                    If your backend is on a different port, make sure CORS allows{" "}
                                    <code className="rounded bg-gray-100 px-1 py-0.5">http://localhost:3000</code>.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full">
                            <table className="min-w-[900px] w-full">
                                <thead className="sticky top-0 bg-gray-50">
                                    <tr className="border-b border-gray-200 text-left text-xs font-semibold tracking-wide text-gray-700">
                                        <th className="px-4 py-3 w-[90px]">Status</th>
                                        <th className="px-4 py-3 w-[60px]">#</th>

                                        <th
                                            className="px-4 py-3 cursor-pointer select-none hover:text-gray-900"
                                            onClick={() => toggleSort("title")}
                                        >
                                            Title <SortCaret active={sortKey === "title"} dir={sortDir} />
                                        </th>

                                        <th
                                            className="px-4 py-3 w-[240px] cursor-pointer select-none hover:text-gray-900"
                                            onClick={() => toggleSort("slug")}
                                        >
                                            Slug <SortCaret active={sortKey === "slug"} dir={sortDir} />
                                        </th>

                                        <th
                                            className="px-4 py-3 w-[420px] cursor-pointer select-none hover:text-gray-900"
                                            onClick={() => toggleSort("id")}
                                        >
                                            ID <SortCaret active={sortKey === "id"} dir={sortDir} />
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="flex flex-col max-h-[60vh] overflow-auto w-full">
                                    {loading
                                        ? Array.from({ length: PAGE_SIZE }, (_, i) => <SkeletonRow key={i} i={i} />)
                                        : pageItems.map((p, idx) => (
                                            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 w-full">
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs text-gray-600">
                                                        -
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-gray-500">
                                                    {(safePage - 1) * PAGE_SIZE + idx + 1}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <Link
                                                        className="font-medium text-gray-900 hover:text-blue-600 hover:underline underline-offset-4"
                                                        to={`/ide/problems/${p.id}`}
                                                    >
                                                        {p.title}
                                                    </Link>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <code className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs text-gray-800">
                                                        {p.slug}
                                                    </code>
                                                </td>

                                                <td className="px-4 py-3 font-mono text-sm text-gray-700">
                                                    {p.id}
                                                </td>
                                            </tr>
                                        ))}

                                    {!loading && pageItems.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                                No problems match "{query}".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
                        Tip: Click column headers to sort. Click a title to open{" "}
                        <code className="rounded bg-gray-100 px-1 py-0.5">/problems/:id</code>.
                    </div>
                </div>
            </div>
        </div>
    );
}