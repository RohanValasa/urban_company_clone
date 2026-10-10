// What the AI assistant worked out (a visit time and a note for the
// professional), handed to checkout for this browser tab.
const KEY = "servify_ai_draft";

export function saveDraft(draft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...draft, at: Date.now() }));
  } catch {
    // Storage blocked: checkout simply starts empty.
  }
}

/** The draft, if one was saved in the last couple of hours. */
export function readDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(KEY));
    return draft && Date.now() - draft.at < 2 * 60 * 60 * 1000 ? draft : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing stored
  }
}
