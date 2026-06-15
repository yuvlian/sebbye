/**
 * SEB (Safe Exam Browser) Configuration Parser and Utilities
 * 
 * This module provides functionality to parse SEB configuration files
 * (plist XML format) and generate configuration keys for header injection.
 */

import CryptoJS from 'crypto-js';

/**
 * Represents a parsed SEB configuration
 */
export interface SebConfig {
  /** The parsed dictionary from the SEB file */
  dictionary: Record<string, unknown>;
  /** JSON serialization of the dictionary (sorted keys, excluding originatorVersion) */
  serializedJson: string;
  /** The start URL from the SEB configuration */
  startUrl: string | undefined;
  /** SHA256 hash of the serialized JSON */
  configHash: string;
}

/**
 * SEB file parser class
 */
export class SebFile {
  private readonly dictionary: Record<string, unknown>;
  private readonly serializedJson: string;
  private readonly startUrl: string | undefined;
  private readonly configHash: string;

  constructor(
    dictionary: Record<string, unknown>,
    serializedJson: string,
    startUrl: string | undefined,
    configHash: string
  ) {
    this.dictionary = dictionary;
    this.serializedJson = serializedJson;
    this.startUrl = startUrl;
    this.configHash = configHash;
  }

  getDictionary(): Record<string, unknown> {
    return this.dictionary;
  }

  getSerializedJson(): string {
    return this.serializedJson;
  }

  getStartUrl(): string | undefined {
    return this.startUrl;
  }

  getConfigHash(): string {
    return this.configHash;
  }

  /**
   * Generate a config key for a given URL by hashing URL + config hash
   */
  getConfigKey(url: string): string {
    return sha256(url + this.configHash);
  }

  /**
   * Create a SebFile instance from SEB XML content
   */
  static async createInstance(sebXml: string): Promise<SebFile | undefined> {
    const dictionary = parseSebXml(sebXml);
    if (!dictionary) {
      return undefined;
    }

    const serializedJson = serializeToJson(dictionary);
    const startUrl = extractStartUrl(dictionary);
    const configHash = computeConfigHash(serializedJson);

    return new SebFile(dictionary, serializedJson, startUrl, configHash);
  }
}

/**
 * Parse SEB XML (plist format) into a dictionary
 */
function parseSebXml(xmlContent: string): Record<string, unknown> | undefined {
  // Use DOMParser (available in browser and service worker context)
  const parser = new DOMParser();
  
  try {
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    const result: Record<string, unknown> = {};
    
    const dictElements = doc.getElementsByTagName('dict');
    if (dictElements.length > 0) {
      const dictElement = dictElements[0];
      if (dictElement) {
        parseDictElement(dictElement, result);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing XML:', error);
    return undefined;
  }
}

/**
 * Parse a dict element and its children
 */
function parseDictElement(element: Element, result: Record<string, unknown>): void {
  const children = Array.from(element.childNodes);
  let currentKey: string | null = null;

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childElement = child as Element;
      
      if (childElement.nodeName === 'key') {
        currentKey = childElement.textContent || null;
      } else if (currentKey) {
        const value = parseValueElement(childElement);
        if (value !== undefined) {
          result[currentKey] = value;
        }
        currentKey = null;
      } else {
        // Handle nested structures without a preceding key (shouldn't happen in valid plist)
        Array.from(childElement.childNodes).forEach((nestedChild) => {
          if (nestedChild.nodeType === Node.ELEMENT_NODE) {
            parseDictElement(nestedChild as Element, result);
          }
        });
      }
    }
  }
}

/**
 * Parse a value element based on its type
 */
function parseValueElement(element: Element): unknown {
  switch (element.nodeName) {
    case 'true':
      return true;
    case 'false':
      return false;
    case 'integer':
      return parseInt(element.textContent || '0', 10);
    case 'real':
      return parseFloat(element.textContent || '0');
    case 'string':
    case 'data':
      return element.textContent?.trim() || '';
    case 'array':
      return parseArrayElement(element);
    case 'dict':
      return parseDictToRecord(element);
    default:
      return undefined;
  }
}

/**
 * Parse an array element
 */
function parseArrayElement(element: Element): unknown[] {
  const result: unknown[] = [];
  
  Array.from(element.childNodes).forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const value = parseValueElement(child as Element);
      if (value !== undefined) {
        result.push(value);
      }
    }
  });
  
  return result;
}

/**
 * Parse a dict element to a record
 */
function parseDictToRecord(element: Element): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  parseDictElement(element, result);
  return result;
}

/**
 * Extract startURL from the parsed dictionary
 */
function extractStartUrl(dictionary: Record<string, unknown>): string | undefined {
  const startURL = dictionary.startURL;
  if (typeof startURL === 'string') {
    return startURL;
  }
  return undefined;
}

/**
 * Serialize dictionary to JSON with sorted keys, excluding originatorVersion
 */
function serializeToJson(dictionary: Record<string, unknown>): string {
  const sortedKeys = Object.keys(dictionary).sort((a, b) => 
    a.localeCompare(b, 'en', { sensitivity: 'base' })
  );

  let json = '{';
  sortedKeys.forEach((key, index) => {
    const value = dictionary[key];
    
    // Skip originatorVersion and empty objects
    if (key.toLowerCase() === 'originatorVersion') {
      return;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const objValue = value as Record<string, unknown>;
      if (Object.keys(objValue).length === 0) {
        return;
      }
    }

    json += `"${key}":${serializeValue(value)}`;
    if (index !== sortedKeys.length - 1) {
      json += ',';
    }
  });
  json += '}';

  return json;
}

/**
 * Serialize a value to JSON string
 */
function serializeValue(value: unknown): string {
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      return serializeArray(value);
    }
    if (value instanceof Uint8Array) {
      return `"${btoa(String.fromCharCode(...Array.from(value)))}"`;
    }
    if (value instanceof Date) {
      return `"${value.toISOString()}"`;
    }
    return serializeRecord(value as Record<string, unknown>);
  }
  
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  
  return '""';
}

/**
 * Serialize an array to JSON string
 */
function serializeArray(arr: unknown[]): string {
  return '[' + arr.map(serializeValue).join(',') + ']';
}

/**
 * Serialize a record to JSON string
 */
function serializeRecord(record: Record<string, unknown>): string {
  const sortedKeys = Object.keys(record).sort((a, b) => 
    a.localeCompare(b, 'en', { sensitivity: 'base' })
  );

  let json = '{';
  sortedKeys.forEach((key, index) => {
    json += `"${key}":${serializeValue(record[key])}`;
    if (index !== sortedKeys.length - 1) {
      json += ',';
    }
  });
  json += '}';

  return json;
}

/**
 * Compute SHA256 hash of a string
 */
function sha256(message: string): string {
  return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
}

/**
 * Compute config hash from serialized JSON
 */
function computeConfigHash(serializedJson: string): string {
  return sha256(serializedJson);
}

export default SebFile;
