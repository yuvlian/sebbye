/**
 * JSON output viewer component
 */

import React from 'react';

interface JsonViewerProps {
  json: string;
  configHash: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ json, configHash }) => {
  const prettifiedJson = React.useMemo(() => {
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return json;
    }
  }, [json]);

  return (
    <div className="json-viewer">
      <h2>Parsed JSON Output</h2>
      <textarea
        className="json-textarea"
        value={prettifiedJson}
        readOnly
        placeholder="JSON output will appear here"
      />

      <h3>Configuration Hash</h3>
      <textarea
        className="hash-textarea"
        value={configHash}
        readOnly
        placeholder="Hash will appear here"
      />
    </div>
  );
};
