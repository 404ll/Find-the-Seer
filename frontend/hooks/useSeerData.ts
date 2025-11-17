import { useCallback, useEffect, useState } from "react";
import { DisplaySeer } from "@/types/display";
import { getSeer } from "@/contracts/query";
import {
  rawSeerToDisplaySeer,
  invalidatePostContentCache,
} from "@/utils/dataTransformers";

interface RefreshOptions {
  invalidateCache?: boolean;
  force?: boolean;
}

const CACHE_TTL_MS = 60 * 1000;
let cachedSeer: DisplaySeer | null = null;
let cacheTimestamp = 0;
let inflightPromise: Promise<DisplaySeer> | null = null;

const isCacheValid = () => cachedSeer !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;

async function fetchSeerFromSource() {
  const rawSeer = await getSeer();
  const displaySeer = await rawSeerToDisplaySeer(rawSeer);
  cachedSeer = displaySeer;
  cacheTimestamp = Date.now();
  return displaySeer;
}

async function loadSeer(options: RefreshOptions = {}) {
  const { invalidateCache = false, force = false } = options;

  if (invalidateCache) {
    cachedSeer = null;
    cacheTimestamp = 0;
    invalidatePostContentCache();
  }

  if (!force && isCacheValid()) {
    return cachedSeer!;
  }

  if (!inflightPromise) {
    inflightPromise = fetchSeerFromSource().finally(() => {
      inflightPromise = null;
    });
  }

  return inflightPromise;
}

export function useSeerData(autoFetch: boolean = true) {
  const [seer, setSeer] = useState<DisplaySeer | null>(cachedSeer);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSeer = useCallback(async (options: RefreshOptions = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const displaySeer = await loadSeer(options);
      setSeer(displaySeer);
      return displaySeer;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSeerAfterTx = useCallback(async () => {
    return refreshSeer({ invalidateCache: true, force: true });
  }, [refreshSeer]);

  useEffect(() => {
    if (autoFetch) {
      if (isCacheValid() && cachedSeer) {
        setSeer(cachedSeer);
      } else {
        refreshSeer();
      }
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

