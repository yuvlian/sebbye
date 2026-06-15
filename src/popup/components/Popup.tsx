/**
 * Main Popup component for sebbye
 */

import React, { useCallback, useState } from 'react';
import { useSebStatus } from '../hooks/useSebStatus';
import { StatusDisplay } from './StatusDisplay';
import { FileUploader } from './FileUploader';
import { FilterEditor } from './FilterEditor';
import { DictionaryViewer } from './DictionaryViewer';
import { SebFile } from '../../utils/seb-tools';
import { DecryptionMethod } from '../../utils/decryptors';

const DEFAULT_RQ_URLS_FILTER = ['<all_urls>'];

export const Popup: React.FC = () => {
  const {
    status,
    tmpUrlsFilter,
    setTmpUrlsFilter,
    updateStatus,
    disable,
    updateFilter,
  } = useSebStatus();

  const [decryptor, setDecryptor] = useState<DecryptionMethod>('None');

  const handleFileLoaded = useCallback(async (sebFile: SebFile) => {
    chrome.runtime.sendMessage(
      {
        action: 'enable',
        sebConfig: {
          dictionary: sebFile.getDictionary(),
          serializedJson: sebFile.getSerializedJson(),
          startUrl: sebFile.getStartUrl(),
          configHash: sebFile.getConfigHash(),
        },
        rqUrlsFilter: DEFAULT_RQ_URLS_FILTER,
      },
      updateStatus
    );
  }, [updateStatus]);

  const handleUpdateToDomain = useCallback(() => {
    if (!status?.sebStartUrl) return;
    const origin = new URL(status.sebStartUrl).origin;
    updateFilter([`${origin}/*`]);
  }, [status?.sebStartUrl, updateFilter]);

  const handleUpdateFilter = useCallback(() => {
    try {
      const parsed = JSON.parse(tmpUrlsFilter || '[]');
      updateFilter(parsed);
    } catch {
      // Error handled in FilterEditor
    }
  }, [tmpUrlsFilter, updateFilter]);

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>sebbye</h1>
        <span className="subtitle">https://github.com/yuvlian/sebbye</span>
      </header>

      {status && (
        <main className="popup-content">
          <StatusDisplay
            enabled={status.enabled}
            errorMsg={status.errorMsg}
            startUrl={status.sebStartUrl}
            rqUrlsFilter={status.rqUrlsFilter}
            onDisable={disable}
          />

          {!status.enabled && (
            <FileUploader onFileLoaded={handleFileLoaded} decryptorMethod={decryptor} onDecryptorChange={setDecryptor} />
          )}

          {status.enabled && (
            <FilterEditor
              tmpUrlsFilter={tmpUrlsFilter}
              startUrl={status.sebStartUrl}
              onTmpUrlsFilterChange={setTmpUrlsFilter}
              onUpdate={handleUpdateFilter}
              onUpdateToDomain={handleUpdateToDomain}
            />
          )}

          {status.sebDictionnary && (
            <DictionaryViewer dictionary={status.sebDictionnary} />
          )}
        </main>
      )}

      <footer className="popup-footer">
        <a href="../debugging/index.html" target="_blank" rel="noopener noreferrer">
          Debugging Tools
        </a>
      </footer>
    </div>
  );
};
