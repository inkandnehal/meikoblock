/**
 * Background Service Worker
 * Handles initialization and state migrations.
 */

import { CONFIG } from "./config.js";

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    console.info("[MeikoBlock] Extension installed successfully.");

    try {
      // Initialize storage with default values to prevent undefined state errors later
      await chrome.storage.local.set({
        ...CONFIG.DEFAULTS,
      });
    } catch (error) {
      console.error("[MeikoBlock] Failed to initialize storage:", error);
    }
  }
});
