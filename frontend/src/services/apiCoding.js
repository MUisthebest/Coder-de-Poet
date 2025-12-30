/*
    This file will be fetched the API ide services written in C#
*/

const API_URL = "http://localhost:5247/api/problems";

const API_SUBMIT_URL = "http://localhost:5247/api/run";

export async function fetchProblems() {
    const response = await fetch(API_URL, { method: 'GET' });

    if (!response.ok) throw new Error('Failed to fetch problems');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Invalid data format');
    return data;
}

export async function fetchProblemDetail(problemId) {
  const res = await fetch(`${API_URL}/${problemId}`, { method: "GET" });
  if (!res.ok) throw new Error("Failed to fetch problem detail");
  return res.json();
}
  
export async function submitSolution(problemId, sourceCode, language, input) {
    const response = await fetch(`${API_SUBMIT_URL}`, {
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