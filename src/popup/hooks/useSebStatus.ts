/**
 * Custom hook for managing sebbye status
 */

import { useState, useEffect, useCallback } from 'react';

export interface SebStatus {
  enabled: boolean;
  sebDictionnary?: Record<string, unknown>;
  sebStartUrl?: string;
  rqUrlsFilter?: string[];
  errorMsg?: string;
}

export function useSebStatus() {
  const [status, setStatus] = useState<SebStatus | null>(null);
  const [tmpUrlsFilter, setTmpUrlsFilter] = useState<string | null>(null);

  // Load initial status
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response: SebStatus) => {
      setTmpUrlsFilter(JSON.stringify(response.rqUrlsFilter, null, 2));
      setStatus(response);
    });
  }, []);

  const updateStatus = useCallback((newStatus: SebStatus) => {
    setStatus(newStatus);
    setTmpUrlsFilter(JSON.stringify(newStatus.rqUrlsFilter, null, 2));
  }, []);

  const disable = useCallback(() => {
    return new Promise<SebStatus>((resolve) => {
      chrome.runtime.sendMessage({ action: 'disable' }, (response: SebStatus) => {
        updateStatus(response);
        resolve(response);
      });
    });
  }, [updateStatus]);

  const updateFilter = useCallback((filter: string[]) => {
    return new Promise<SebStatus>((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'updateRqUrlsFilter', rqUrlsFilter: filter },
        (response: SebStatus) => {
          updateStatus(response);
          resolve(response);
        }
      );
    });
  }, [updateStatus]);

  return {
    status,
    tmpUrlsFilter,
    setTmpUrlsFilter,
    updateStatus,
    disable,
    updateFilter,
  };
}
