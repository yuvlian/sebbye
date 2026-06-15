/**
 * Config key generator component
 */

import React, { useState } from 'react';
import { SebFile } from '../../utils/seb-tools';

interface ConfigKeyGeneratorProps {
  sebFile: SebFile | null;
}

export const ConfigKeyGenerator: React.FC<ConfigKeyGeneratorProps> = ({ sebFile }) => {
  const [url, setUrl] = useState<string>('');
  const [configKey, setConfigKey] = useState<string>('');

  const handleGetConfigKey = () => {
    if (sebFile && url) {
      const key = sebFile.getConfigKey(url);
      setConfigKey(key);
    }
  };

  return (
    <div className="config-key-generator">
      <h2>Generate Config Key</h2>
      <div className="input-group">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to generate config key"
          className="url-input"
        />
        <button className="btn btn-primary" onClick={handleGetConfigKey}>
          Generate Key
        </button>
      </div>

      {configKey && (
        <div className="result">
          <h3>Config Key for URL</h3>
          <textarea
            className="key-textarea"
            value={configKey}
            readOnly
          />
        </div>
      )}
    </div>
  );
};
