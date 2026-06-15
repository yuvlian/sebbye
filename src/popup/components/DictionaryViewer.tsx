/**
 * SEB dictionary viewer component
 */

import React from 'react';

interface DictionaryViewerProps {
  dictionary: Record<string, unknown>;
}

export const DictionaryViewer: React.FC<DictionaryViewerProps> = ({ dictionary }) => {
  return (
    <div className="dictionary-viewer">
      <h2>Configuration Dictionary</h2>
      <textarea
        className="dictionary-textarea"
        readOnly
        value={JSON.stringify(dictionary, null, 2)}
      />
    </div>
  );
};
