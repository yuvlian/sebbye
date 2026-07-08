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
    updateSettings,
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
            <FileUploader onFileLoaded={handleFileLoaded} decryptorMethod={decryptor} />
          )}

          <div className="status-section" style={{ marginTop: '12px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600 }}>Settings</h3>
            
            {!status.enabled && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 0' }}>
                <span className="status-label" style={{ fontSize: '13px' }}>Decryption Method</span>
                <select
                  id="decryptor-select"
                  value={decryptor}
                  onChange={e => setDecryptor(e.target.value as DecryptionMethod)}
                  style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                >
                  <option value="None">None</option>
                  <option value="Test">Test</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 0' }}>
              <span className="status-label" style={{ fontSize: '13px' }}>Display Fake Bars</span>
              <input
                type="checkbox"
                id="displayFakeBars"
                checked={status.settings?.displayFakeBars !== false}
                onChange={(e) => updateSettings(e.target.checked, status.settings?.displayArrows !== false)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '6px 0' }}>
              <span className="status-label" style={{ fontSize: '13px' }}>Display Navigation Arrows</span>
              <input
                type="checkbox"
                id="displayArrows"
                checked={status.settings?.displayArrows !== false}
                onChange={(e) => updateSettings(status.settings?.displayFakeBars !== false, e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>

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
