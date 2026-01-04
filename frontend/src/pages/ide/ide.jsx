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
            <td className="py-3 px-6">
                <div className="h-6 w-14 rounded-full bg-gray-200 animate-pulse" />
            </td>
            <td className="py-3 px-6">
                <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
            </td>
            <td className="py-3 px-6">
                <div className="h-4 w-64 rounded bg-gray-200 animate-pulse" />
            </td>
            <td className="py-3 px-6">
                <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
            </td>
            <td className="py-3 px-6">
                <div className="h-4 w-72 rounded bg-gray-200 animate-pulse" />
            </td>
        </tr>
    );
}

function SortCaret({ active, dir }) {
    if (!active) return <span className="ml-2 text-gray-400">↕</span>;
    return <span className="ml-2">{dir === "asc" ? "↑" : "↓"}</span>;
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
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 font-extrabold text-white">
                            L
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Problemset</h1>
                            <p className="text-sm text-gray-600">LeetCode-style list from your API</p>
                        </div>
                    </div>

                    <div className="w-full sm:w-96">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                placeholder="Search by title or slug..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Card */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    {/* Card header - Stats & Pagination */}
                    <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-600">
                            {loading ? "Loading..." : `Showing ${pageItems.length} of ${total} problems`}
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
                                Page <span className="font-semibold text-gray-900">{safePage}</span> of {totalPages}
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

                    {/* Error State */}
                    {err ? (
                        <div className="px-6 py-8">
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                                <div className="flex items-center">
                                    <svg className="mr-3 h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <h3 className="text-sm font-medium text-red-800">Failed to load problems</h3>
                                </div>
                                <div className="mt-2 text-sm text-red-700">
                                    {err}
                                    <div className="mt-2 text-red-600">
                                        If your backend is on a different port, make sure CORS allows{" "}
                                        <code className="rounded bg-red-100 px-1 py-0.5">http://localhost:3000</code>.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden  h-[calc(80vh_-_100px)]">
                            <div className="overflow-x-auto h-full">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                            <th className="px-6 py-3 w-24 whitespace-nowrap">Status</th>
                                            <th className="px-6 py-3 w-16 whitespace-nowrap">#</th>
                                            <th
                                                className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 hover:text-gray-900"
                                                onClick={() => toggleSort("title")}
                                            >
                                                <div className="flex items-center whitespace-nowrap">
                                                    Title
                                                    <SortCaret active={sortKey === "title"} dir={sortDir} />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 hover:text-gray-900"
                                                onClick={() => toggleSort("slug")}
                                            >
                                                <div className="flex items-center whitespace-nowrap">
                                                    Slug
                                                    <SortCaret active={sortKey === "slug"} dir={sortDir} />
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-3 cursor-pointer select-none hover:bg-gray-100 hover:text-gray-900"
                                                onClick={() => toggleSort("id")}
                                            >
                                                <div className="flex items-center whitespace-nowrap">
                                                    ID
                                                    <SortCaret active={sortKey === "id"} dir={sortDir} />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {loading
                                            ? Array.from({ length: PAGE_SIZE }, (_, i) => <SkeletonRow key={i} i={i} />)
                                            : pageItems.map((p, idx) => (
                                                <tr key={p.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="whitespace-nowrap px-6 py-4 w-24">
                                                        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                            -
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 w-16">
                                                        {(safePage - 1) * PAGE_SIZE + idx + 1}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Link
                                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                            to={`/ide/problems/${p.id}`}
                                                        >
                                                            {p.title}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <code className="rounded-md bg-gray-100 px-2 py-1 text-xs font-mono text-gray-800">
                                                            {p.slug}
                                                        </code>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-mono text-gray-700 truncate">
                                                            {p.id}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}

                                        {!loading && pageItems.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <p className="mt-2 text-sm text-gray-500">
                                                            No problems found matching "{query}"
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Try adjusting your search terms
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-6 py-3">
                        <div className="text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Click column headers to sort • Click problem title to open details
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}