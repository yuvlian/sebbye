/**
 * Main Debugging Page component
 */

import React, { useState } from 'react';
import { SebFile } from '../../utils/seb-tools';
import { FileLoader } from './FileLoader';
import { JsonViewer } from './JsonViewer';
import { ConfigKeyGenerator } from './ConfigKeyGenerator';

export const DebuggingPage: React.FC = () => {
  const [sebFile, setSebFile] = useState<SebFile | null>(null);

  const handleFileLoaded = (file: SebFile) => {
    setSebFile(file);
  };

  return (
    <div className="debugging-container">
      <header className="debugging-header">
        <h1>Debugging Tools</h1>
      </header>

      <main className="debugging-content">
        <FileLoader onFileLoaded={handleFileLoaded} />

        {sebFile && (
          <>
            <JsonViewer
              json={sebFile.getSerializedJson()}
              configHash={sebFile.getConfigHash()}
            />
            <ConfigKeyGenerator sebFile={sebFile} />
          </>
        )}
      </main>
    </div>
  );
};
