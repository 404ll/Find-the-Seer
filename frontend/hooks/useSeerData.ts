import { useCallback, useEffect, useState } from "react";
import { DisplaySeer } from "@/types/display";
import { getSeer } from "@/contracts/query";
import {
  rawSeerToDisplaySeer,
  invalidatePostContentCache,
} from "@/utils/dataTransformers";

interface RefreshOptions {
  invalidateCache?: boolean;
}

export function useSeerData(autoFetch: boolean = true) {
  const [seer, setSeer] = useState<DisplaySeer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSeer = useCallback(
    async (options: RefreshOptions = {}) => {
      if (options.invalidateCache) {
        invalidatePostContentCache();
      }

      setIsLoading(true);
      setError(null);
      try {
        const rawSeer = await getSeer();
        const displaySeer = await rawSeerToDisplaySeer(rawSeer);
        setSeer(displaySeer);
        return displaySeer;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refreshSeerAfterTx = useCallback(async () => {
    return refreshSeer({ invalidateCache: true });
  }, [refreshSeer]);

  useEffect(() => {
    if (autoFetch) {
      refreshSeer();
    }
  }, [autoFetch, refreshSeer]);

  return {
    seer,
    isLoading,
    error,
    refreshSeer,
    refreshSeerAfterTx,
  };
}

