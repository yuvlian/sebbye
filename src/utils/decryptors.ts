export type DecryptionMethod = 'None' | 'Test';

/**
 * Interface for decryption implementations.
 * Implementations should take the raw file content as a string and return the decrypted content.
 */
export interface Decryptor {
  decrypt(content: string): string;
}

class NoneDecryptor implements Decryptor {
  decrypt(content: string): string {
    return content;
  }
}

// Gonna finish this when I actually need to decrypt a file.
class TestDecryptor implements Decryptor {
  decrypt(content: string): string {
    return content;
  }
}

const decryptorRegistry: Record<DecryptionMethod, Decryptor> = {
  None: new NoneDecryptor(),
  Test: new TestDecryptor(),
};

export function decryptContent(content: string, method: DecryptionMethod = 'None'): string {
  const decryptor = decryptorRegistry[method] ?? decryptorRegistry['None'];
  return decryptor.decrypt(content);
}

export default decryptorRegistry;
