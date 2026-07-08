/**
 * sebbye Background Service Worker
 * 
 * Handles:
 * - Message passing from popup
 * - Extension icon click
 */

import { SebController } from './controller';
import { SebFile } from '../utils/seb-tools';
import type { SebMessage, SebStatus } from './messages';

const sebController = new SebController();

/**
 * Handle messages from popup
 */
chrome.runtime.onMessage.addListener(
  (
    message: SebMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: SebStatus | { errorMsg: string }) => void
  ) => {
    switch (message.action) {
      case 'enable':
        if (message.sebConfig) {
          try {
            const { dictionary, serializedJson, startUrl, configHash } = message.sebConfig;
            const sebFile = new SebFile(dictionary, serializedJson, startUrl, configHash);
            sebController.enable(sebFile, message.rqUrlsFilter || [])
              .then(() => {
                sendResponse(sebController.getStatus());
              })
              .catch((error) => {
                sendResponse(sebController.getStatus(`Error: ${error.message}`));
              });
          } catch (error: any) {
            sendResponse(sebController.getStatus(`Error: ${error.message}`));
          }
          return true; // Keep message channel open for async response
        }
        sendResponse({ errorMsg: 'Missing sebConfig for enable action' });
        break;

      case 'disable':
        sebController
          .disable()
          .then(() => {
            sendResponse(sebController.getStatus());
          })
          .catch((error) => {
            sendResponse(sebController.getStatus(`Error: ${error.message}`));
          });
        return true;

      case 'getStatus':
        sendResponse(sebController.getStatus());
        break;

      case 'updateSettings':
        if (message.settings) {
          const { displayFakeBars, displayArrows } = message.settings;
          sebController
            .updateSettings(displayFakeBars, displayArrows)
            .then(() => {
              sendResponse(sebController.getStatus());
            })
            .catch((error: any) => {
              sendResponse(sebController.getStatus(`Error: ${error.message}`));
            });
          return true;
        }
        sendResponse({ errorMsg: 'Missing settings' });
        break;

      case 'updateRqUrlsFilter':
        if (message.rqUrlsFilter) {
          sebController
            .updateRqUrlsFilter(message.rqUrlsFilter)
            .then(() => {
              sendResponse(sebController.getStatus());
            })
            .catch((error) => {
              sendResponse(sebController.getStatus(`Error: ${error.message}`));
            });
          return true;
        }
        sendResponse({ errorMsg: 'Missing rqUrlsFilter' });
        break;

      default:
        sendResponse({ errorMsg: 'Unknown action' });
        break;
    }

    return false; // close channel if no async work was initiated
  }
);

export { SebController };
export type { SebStatus, SebMessage };
