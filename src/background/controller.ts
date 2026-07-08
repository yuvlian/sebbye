/**
 * sebbye Controller - manages the state and rules for sebbye mode
 * 
 * Handles:
 * - SEB configuration enable/disable
 * - HTTP header modification (User-Agent, ConfigKeyHash)
 * - Declarative net request rules management
 */

import { SebFile } from '../utils/seb-tools';
import type { SebStatus } from './messages';

const SEB_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 SEB/3.7.0 (x64)';
const CONFIG_KEY_HEADER = 'X-SafeExamBrowser-ConfigKeyHash';

export class SebController {
  private isEnabled: boolean = false;
  private sebFile: SebFile | undefined = undefined;
  private rqUrlsFilter: string[] = [];
  private requestListener: ((details: chrome.webRequest.OnBeforeRequestDetails) => chrome.webRequest.BlockingResponse | undefined) | undefined = undefined;

  // Bullshit to prevent duplicate ID collision errors
  private dynamicRuleIds: number[] = Array.from({ length: 50 }, (_, i) => 100 + i);
  private dynamicRuleIndex: number = 0;
  private urlToRuleId: Map<string, number> = new Map();
  private ruleIdToUrl: Map<number, string> = new Map();

  private displayFakeBars: boolean = true;
  private displayArrows: boolean = true;

  constructor() {
    chrome.storage.local.get(['displayFakeBars', 'displayArrows'], (result) => {
      if (result.displayFakeBars !== undefined && result.displayFakeBars !== null) {
        this.displayFakeBars = Boolean(result.displayFakeBars);
      }
      if (result.displayArrows !== undefined && result.displayArrows !== null) {
        this.displayArrows = Boolean(result.displayArrows);
      }
      this.broadcastStatus();
    });
  }

  async updateRqUrlsFilter(urls: string[]): Promise<void> {
    if (!this.isEnabled) {
      throw new Error('Not enabled');
    }
    this.rqUrlsFilter = urls;
    await this.refreshRules();
    this.broadcastStatus();
  }

  async refreshRules(): Promise<void> {
    // Get existing rules to remove
    const existingRules = await chrome.declarativeNetRequest.getSessionRules();
    const removeRuleIds = existingRules.map((rule) => rule.id);

    const addRules: chrome.declarativeNetRequest.Rule[] = [];

    // Rule 1: Modify User-Agent header for all requests
    addRules.push({
      id: 1,
      priority: 1,
      action: {
        type: 'modifyHeaders' as const,
        requestHeaders: [
          {
            header: 'User-Agent',
            operation: 'set' as const,
            value: SEB_USER_AGENT,
          },
        ],
      },
      condition: {
        urlFilter: '*',
        resourceTypes: [
          'main_frame' as chrome.declarativeNetRequest.ResourceType,
          'sub_frame' as chrome.declarativeNetRequest.ResourceType,
          'xmlhttprequest' as chrome.declarativeNetRequest.ResourceType,
          'script' as chrome.declarativeNetRequest.ResourceType,
        ],
      },
    });

    // Rule 2: Add ConfigKeyHash header for start URL if available
    if (this.sebFile && this.sebFile.getStartUrl()) {
      try {
        const configKey = this.sebFile.getConfigKey(this.sebFile.getStartUrl()!);
        addRules.push({
          id: 2,
          priority: 2,
          action: {
            type: 'modifyHeaders' as const,
            requestHeaders: [
              {
                header: CONFIG_KEY_HEADER,
                operation: 'set' as const,
                value: configKey,
              },
            ],
          },
          condition: {
            urlFilter: this.sebFile.getStartUrl()!,
            resourceTypes: [
              'main_frame' as chrome.declarativeNetRequest.ResourceType,
              'sub_frame' as chrome.declarativeNetRequest.ResourceType,
              'xmlhttprequest' as chrome.declarativeNetRequest.ResourceType,
            ],
          },
        });
      } catch (error) {
        console.error('Error Calculating Key', error);
      }
    }

    // Update rules
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds,
      addRules,
    });
  }

  async enable(sebFile: SebFile, rqUrlsFilter: string[]): Promise<void> {
    if (this.isEnabled) {
      throw new Error('Already enabled');
    }

    this.sebFile = sebFile;
    this.isEnabled = true;
    this.rqUrlsFilter = rqUrlsFilter;

    await this.refreshRules();

    // Add request listener for dynamic header injection
    this.requestListener = (details: chrome.webRequest.OnBeforeRequestDetails) => {
      if (this.isEnabled && this.sebFile) {
        try {
          const configKey = this.sebFile.getConfigKey(details.url);

          // Check if a rule is already active for this exact URL
          if (this.urlToRuleId.has(details.url)) {
            return undefined;
          }

          const ruleId = this.dynamicRuleIds[this.dynamicRuleIndex];
          this.dynamicRuleIndex = (this.dynamicRuleIndex + 1) % this.dynamicRuleIds.length;

          // Clean up old mapping if this ruleId is reused
          const previousUrl = this.ruleIdToUrl.get(ruleId);
          if (previousUrl) {
            this.urlToRuleId.delete(previousUrl);
          }

          this.urlToRuleId.set(details.url, ruleId);
          this.ruleIdToUrl.set(ruleId, details.url);

          chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [ruleId],
            addRules: [
              {
                id: ruleId,
                priority: 3,
                action: {
                  type: 'modifyHeaders' as const,
                  requestHeaders: [
                    {
                      header: 'User-Agent',
                      operation: 'set' as const,
                      value: SEB_USER_AGENT,
                    },
                    {
                      header: CONFIG_KEY_HEADER,
                      operation: 'set' as const,
                      value: configKey,
                    },
                  ],
                },
                condition: {
                  urlFilter: details.url,
                  resourceTypes: [
                    'main_frame' as chrome.declarativeNetRequest.ResourceType,
                    'sub_frame' as chrome.declarativeNetRequest.ResourceType,
                    'xmlhttprequest' as chrome.declarativeNetRequest.ResourceType,
                    'other' as chrome.declarativeNetRequest.ResourceType,
                  ],
                },
              },
            ],
          });
        } catch (error) {
          // Silently ignore errors for individual requests
        }
      }
      return undefined;
    };

    chrome.webRequest.onBeforeRequest.addListener(this.requestListener, {
      urls: ['<all_urls>'],
    });

    this.broadcastStatus();
  }

  async disable(): Promise<void> {
    if (!this.isEnabled) {
      throw new Error('Already disabled');
    }

    this.isEnabled = false;
    this.sebFile = undefined;
    this.rqUrlsFilter = [];

    // Clear dynamic rules tracking cache
    this.urlToRuleId.clear();
    this.ruleIdToUrl.clear();
    this.dynamicRuleIndex = 0;

    // Remove request listener
    if (this.requestListener) {
      chrome.webRequest.onBeforeRequest.removeListener(this.requestListener);
    }

    // Clear all session rules
    const existingRules = await chrome.declarativeNetRequest.getSessionRules();
    const removeRuleIds = existingRules.map((rule) => rule.id);
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds,
    });

    this.broadcastStatus();
  }

  async updateSettings(displayFakeBars?: boolean, displayArrows?: boolean): Promise<void> {
    if (displayFakeBars !== undefined) this.displayFakeBars = displayFakeBars;
    if (displayArrows !== undefined) this.displayArrows = displayArrows;

    await chrome.storage.local.set({
      displayFakeBars: this.displayFakeBars,
      displayArrows: this.displayArrows,
    });

    this.broadcastStatus();
  }

  getStatus(errorMsg?: string): SebStatus {
    return {
      enabled: this.isEnabled,
      sebDictionnary: this.sebFile?.getDictionary(),
      sebStartUrl: this.sebFile?.getStartUrl(),
      rqUrlsFilter: this.rqUrlsFilter,
      settings: {
        displayFakeBars: this.displayFakeBars,
        displayArrows: this.displayArrows,
      },
      errorMsg,
    };
  }

  private broadcastStatus(): void {
    const status = this.getStatus();
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'statusChanged', status }).catch(() => {
            // Ignore tab if content script is not loaded
          });
        }
      }
    });
  }
}
