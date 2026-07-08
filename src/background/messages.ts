/**
 * Message types for communication between popup and background
 */

export interface SebMessage {
  action: 'enable' | 'disable' | 'getStatus' | 'updateRqUrlsFilter' | 'updateSettings';
  sebXML?: string;
  sebConfig?: {
    dictionary: Record<string, unknown>;
    serializedJson: string;
    startUrl: string | undefined;
    configHash: string;
  };
  rqUrlsFilter?: string[];
  settings?: {
    displayFakeBars?: boolean;
    displayArrows?: boolean;
  };
}

export interface SebStatus {
  enabled: boolean;
  sebDictionnary?: Record<string, unknown>;
  sebStartUrl?: string;
  rqUrlsFilter?: string[];
  errorMsg?: string;
  settings?: {
    displayFakeBars: boolean;
    displayArrows: boolean;
  };
}
