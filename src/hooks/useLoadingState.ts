import { useState, useCallback } from "react";

interface LoadingState {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  executeWithLoading: <T>(asyncFn: () => Promise<T>) => Promise<T>;
}

export const useLoadingState = (): LoadingState => {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const executeWithLoading = useCallback(async <T,>(asyncFn: () => Promise<T>): Promise<T> => {
    if (isLoading) {
      throw new Error("Operation already in progress");
    }

    startLoading();
    try {
      const result = await asyncFn();
      return result;
    } finally {
      stopLoading();
    }
  }, [isLoading, startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    executeWithLoading,
  };
};