/**
 * URL filter editor component
 */

import React, { useState } from 'react';

interface FilterEditorProps {
  tmpUrlsFilter: string | null;
  startUrl?: string;
  onTmpUrlsFilterChange: (value: string) => void;
  onUpdate: () => void;
  onUpdateToDomain: () => void;
}

export const FilterEditor: React.FC<FilterEditorProps> = ({
  tmpUrlsFilter,
  startUrl,
  onTmpUrlsFilterChange,
  onUpdate,
  onUpdateToDomain,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = () => {
    try {
      JSON.parse(tmpUrlsFilter || '[]');
      setError(null);
      onUpdate();
    } catch {
      setError('Invalid JSON format');
    }
  };

  if (tmpUrlsFilter === null) {
    return <div className="filter-editor disabled">Filter not available</div>;
  }

  return (
    <div className="filter-editor">
      <h2>Request URL Filter</h2>
      <textarea
        className="filter-textarea"
        value={tmpUrlsFilter}
        onChange={(e) => onTmpUrlsFilterChange(e.target.value)}
        rows={6}
        placeholder='["<all_urls>"]'
      />
      {error && <div className="error-message">{error}</div>}
      <div className="button-group">
        <button className="btn btn-primary" onClick={handleUpdate}>
          Update Filter
        </button>
        {startUrl && (
          <button className="btn btn-secondary" onClick={onUpdateToDomain}>
            Set to Start URL Domain
          </button>
        )}
      </div>
    </div>
  );
};
