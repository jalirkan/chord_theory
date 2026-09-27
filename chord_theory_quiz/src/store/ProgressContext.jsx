import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  applyAnswer,
  applySession,
  emptyProgress,
  normalize,
  STORAGE_KEY,
} from "./progress.js";
import { readJSON, writeJSON } from "./storage.js";

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(() => normalize(readJSON(STORAGE_KEY, null)));
  // Mirror of the latest state for callers that need a synchronous answer.
  const latest = useRef(progress);
  latest.current = progress;

  useEffect(() => {
    writeJSON(STORAGE_KEY, progress);
  }, [progress]);

  const answer = useCallback((cardId, correct) => {
    setProgress((p) => applyAnswer(p, cardId, correct));
  }, []);

  const finishSession = useCallback((session) => {
    const result = applySession(latest.current, session);
    latest.current = result.progress;
    setProgress(result.progress);
    return result;
  }, []);

  const setSetting = useCallback((key, value) => {
    setProgress((p) => ({ ...p, settings: { ...p.settings, [key]: value } }));
  }, []);

  const reset = useCallback(() => setProgress(emptyProgress()), []);

  const value = useMemo(
    () => ({ progress, answer, finishSession, setSetting, reset }),
    [progress, answer, finishSession, setSetting, reset]
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}
