// frontend/src/utils/userStorage.js

export function getUserKey(user) {
  const email =
    user?.email ||
    user?.username ||
    user?.id ||
    user?.user_id ||
    'guest';

  return String(email)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_');
}

export function getHistoryKey(user) {
  return `aquaxai-history-${getUserKey(user)}`;
}

export function getLatestAnalysisKey(user) {
  return `aquaxai-latest-analysis-${getUserKey(user)}`;
}

export function saveUserHistory(user, analysis) {
  if (!user || !analysis) return;

  const key = getHistoryKey(user);

  let history = [];

  try {
    history = JSON.parse(localStorage.getItem(key) || '[]');

    if (!Array.isArray(history)) {
      history = [];
    }
  } catch {
    history = [];
  }

  const record = {
    ...analysis,
    created_at:
      analysis.created_at ||
      new Date().toISOString(),
  };

  history.unshift(record);

  localStorage.setItem(
    key,
    JSON.stringify(history)
  );

  localStorage.setItem(
    getLatestAnalysisKey(user),
    JSON.stringify(record)
  );
}

export function getUserHistory(user) {
  if (!user) return [];

  try {
    const data = JSON.parse(
      localStorage.getItem(getHistoryKey(user)) || '[]'
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getLatestAnalysis(user) {
  if (!user) return null;

  try {
    const data = localStorage.getItem(
      getLatestAnalysisKey(user)
    );

    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearUserAnalysis(user) {
  if (!user) return;

  localStorage.removeItem(getHistoryKey(user));
  localStorage.removeItem(getLatestAnalysisKey(user));
}