/*
    This file will be fetched the API ide services written in C#
*/

const API_CONFIG = {
  BASE_URL: process.env.IDE_SERVICE_URL || "http://localhost:5247",
  ENDPOINTS: {
    PROBLEMS: "/api/problems",
    RUN: "/api/run"
  }
};

const buildUrl = (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`;

export async function fetchProblems() {
    const url = buildUrl(API_CONFIG.ENDPOINTS.PROBLEMS);
    const response = await fetch(url, { method: 'GET' });

    if (!response.ok) throw new Error('Failed to fetch problems');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid data format');
    return data;
}

export async function fetchProblemDetail(problemId) {
  const url = `${buildUrl(API_CONFIG.ENDPOINTS.PROBLEMS)}/${problemId}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error("Failed to fetch problem detail");
  return res.json();
}
  
export async function submitSolution(problemId, sourceCode, language, input) {
    const url = buildUrl(API_CONFIG.ENDPOINTS.RUN);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problemId, sourceCode, language, input }),
    });

    if (!response.ok) {
        throw new Error('Failed to submit solution');
    }
    return await response.json();
}