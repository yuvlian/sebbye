/**
 * Status display component
 */

import React from 'react';

interface StatusDisplayProps {
  enabled: boolean;
  errorMsg?: string;
  startUrl?: string;
  rqUrlsFilter?: string[];
  onDisable: () => void;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  enabled,
  errorMsg,
  startUrl,
  rqUrlsFilter,
  onDisable,
}) => {
  return (
    <div className="status-section">
      <div className="status-row">
        <span className="status-label">Status</span>
        <span className={`status-value ${enabled ? 'enabled' : 'disabled'}`}>
          {enabled ? '● Enabled' : '○ Disabled'}
        </span>
      </div>

      {errorMsg && (
        <div className="status-row error">
          <span className="status-label">Error</span>
          <span className="status-value">{errorMsg}</span>
        </div>
      )}

      {enabled && startUrl && (
        <div className="status-row">
          <span className="status-label">Start URL</span>
          <a
            className="status-value link"
            href={startUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {startUrl}
          </a>
        </div>
      )}

      {enabled && rqUrlsFilter && (
        <div className="status-row">
          <span className="status-label">URL Filter</span>
          <span className="status-value code">
            {JSON.stringify(rqUrlsFilter)}
          </span>
        </div>
      )}

      {enabled && (
        <button className="btn btn-danger" onClick={onDisable}>
          Disable
        </button>
      )}
    </div>
  );
};
