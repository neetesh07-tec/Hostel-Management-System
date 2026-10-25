import { useState, useCallback, useEffect, useRef } from 'react';

export function useApi(fetcher, options = {}) {
  const { immediate = true } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  // Store the fetcher in a ref so its identity changes don't re-create
  // the execute callback (which would cause an infinite loop when an
  // inline arrow function is passed as fetcher).
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcherRef.current(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, loading, error, refetch: execute, setData, reset };
}
