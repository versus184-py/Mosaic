import { useState, useEffect, useCallback } from "react";
import { checkOllamaConnection, listOllamaModels, type OllamaModel } from "../api/ollama";
import { useUIStore } from "../store/uiStore";

export function useOllamaDetect() {
  const [checking, setChecking] = useState(false);
  const setOllamaConnected = useUIStore((s) => s.setOllamaConnected);
  const setOllamaModels = useUIStore((s) => s.setOllamaModels);
  const ollamaConnected = useUIStore((s) => s.ollamaConnected);

  const check = useCallback(async () => {
    setChecking(true);
    const connected = await checkOllamaConnection();
    setOllamaConnected(connected);
    if (connected) {
      const models = await listOllamaModels();
      setOllamaModels(models);
    } else {
      setOllamaModels([]);
    }
    setChecking(false);
  }, [setOllamaConnected, setOllamaModels]);

  useEffect(() => {
    check();
  }, [check]);

  return { checking, retry: check, connected: ollamaConnected };
}