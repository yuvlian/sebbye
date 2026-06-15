/**
 * File loader component for debugging page
 */

import React, { useState } from 'react';
import { SebFile } from '../../utils/seb-tools';
import { DecryptionMethod, decryptContent } from '../../utils/decryptors';

interface FileLoaderProps {
  onFileLoaded: (sebFile: SebFile) => void;
}

export const FileLoader: React.FC<FileLoaderProps> = ({ onFileLoaded }) => {
  const [decryptor, setDecryptor] = useState<DecryptionMethod>('None');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result;
      if (content && typeof content === 'string') {
        try {
          const decrypted = decryptContent(content, decryptor);
          const parsed = await SebFile.createInstance(decrypted);
          if (!parsed) {
            alert('Error parsing SEB file');
            return;
          }
          onFileLoaded(parsed);
        } catch (error: any) {
          alert(`Error parsing file: ${error.message}`);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="file-loader">
      <div className="decryptor-select">
        <label htmlFor="debug-decryptor-select">Decryption Method:</label>
        <select
          id="debug-decryptor-select"
          value={decryptor}
          onChange={e => setDecryptor(e.target.value as DecryptionMethod)}
        >
          <option value="None">None</option>
          <option value="Test">Test</option>
        </select>
      </div>

      <label className="file-input-label">
        <span className="file-input-text">Load SEB Configuration File</span>
        <input
          type="file"
          accept=".xml,.seb"
          onChange={handleFileChange}
          className="file-input"
        />
      </label>
    </div>
  );
};
