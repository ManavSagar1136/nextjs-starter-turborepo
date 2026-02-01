"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
}

export interface OfflineQueueItem<T> {
  id: string;
  operation: () => Promise<T>;
  timestamp: number;
  retries: number;
}

// ============================================================================
// Offline Detection Hook
// ============================================================================

/**
 * Hook for detecting online/offline status
 */
export function useOfflineDetection(): OfflineState {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Trigger a small delay to ensure connection is stable
        setTimeout(() => {
          setWasOffline(false);
        }, 1000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

// ============================================================================
// Offline Queue Hook
// ============================================================================

/**
 * Hook for queuing operations when offline and syncing when back online
 */
export function useOfflineQueue<T>() {
  const { isOnline } = useOfflineDetection();
  const [queue, setQueue] = useState<OfflineQueueItem<T>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addToQueue = useCallback((operation: () => Promise<T>): string => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const item: OfflineQueueItem<T> = {
      id,
      operation,
      timestamp: Date.now(),
      retries: 0,
    };

    setQueue(prev => [...prev, item]);
    return id;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0 || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const items = [...queue];
      const results: Array<{ id: string; success: boolean; error?: Error }> = [];

      for (const item of items) {
        try {
          await item.operation();
          results.push({ id: item.id, success: true });
        } catch (error) {
          // Increment retries
          const updatedItem = { ...item, retries: item.retries + 1 };

          // Remove if max retries reached (3)
          if (updatedItem.retries >= 3) {
            results.push({
              id: item.id,
              success: false,
              error: error instanceof Error ? error : new Error(String(error)),
            });
          } else {
            // Update queue item with new retry count
            setQueue(prev => prev.map(q => (q.id === item.id ? updatedItem : q)));
          }
        }
      }

      // Remove successful items
      const successfulIds = results.filter(r => r.success).map(r => r.id);
      setQueue(prev => prev.filter(item => !successfulIds.includes(item.id)));
    } finally {
      setIsProcessing(false);
    }
  }, [isOnline, queue, isProcessing]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue();
    }
  }, [isOnline, queue.length, processQueue]);

  return {
    queue,
    isOnline,
    isProcessing,
    addToQueue,
    removeFromQueue,
    processQueue,
    queueLength: queue.length,
  };
}
