/**
 * File uploader component for SEB configuration files
 */

import React from 'react';
import { DecryptionMethod, decryptContent } from '../../utils/decryptors';
import { SebFile } from '../../utils/seb-tools';

interface FileUploaderProps {
  onFileLoaded: (sebFile: SebFile) => void;
  decryptorMethod: DecryptionMethod;
  onDecryptorChange: (method: DecryptionMethod) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded, decryptorMethod, onDecryptorChange }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      try {
        const decrypted = decryptContent(content, decryptorMethod);
        const sebFile = await SebFile.createInstance(decrypted);
        if (!sebFile) {
          alert('Error parsing SEB file');
          return;
        }
        onFileLoaded(sebFile);
      } catch (error: any) {
        alert(`Error parsing file: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="file-uploader">
      <div className="decryptor-select">
        <label htmlFor="decryptor-select">Decryption Method:</label>
        <select
          id="decryptor-select"
          value={decryptorMethod}
          onChange={e => onDecryptorChange(e.target.value as DecryptionMethod)}
        >
          <option value="None">None</option>
          <option value="Test">Test</option>
        </select>
      </div>

      <label className="file-input-label">
        <span className="file-input-text">Choose SEB Configuration File</span>
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
