/**
 * Popup Logic
 * Fixes: "Race Condition" on remove. Removes blocking rule BEFORE signaling redirect.
 */

const CONFIG = {
  PRIORITY_SAFE: 9999,
  PRIORITY_FANCY_REDIRECT: 5000,
  PRIORITY_SIMPLE_REDIRECT: 4000,
  PRIORITY_HARD_BLOCK: 1,

  PANIC_RULE_ID: 900000,

  // Storage Keys
  STORAGE_KEYS: {
    BLOCKED_SITES: "blockedSites",
    WHITELISTED_SITES: "whitelistedSites",
    PANIC_MODE: "panicMode",
    IS_PAUSED: "isPaused",
    BLOCK_SUBDOMAINS: "blockSubdomains",
    DISABLE_FOCUS_ANIMATIONS: "focusAnimations",
  },

  // Default Settings
  DEFAULTS: {
    blockedSites: [],
    whitelistedSites: [],
    panicMode: false,
    isPaused: false,
    blockSubdomains: false,
    disableFocusAnimations: false,
  },

  MAX_ID_RANGE: 800000,
  DOMAIN_REGEX:
    /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
};

// Storage Keys Helper
const ALL_STORAGE_KEYS = Object.values(CONFIG.STORAGE_KEYS);

const elements = {
  domainInput: document.getElementById("domainInput"),
  addBtn: document.getElementById("addBlockRuleBtn"),
  siteList: document.getElementById("siteList"),
  listTitle: document.getElementById("listTitle"),
  panicToggle: document.getElementById("panicToggle"),
  powerBtn: document.getElementById("powerBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  resetAllBtn: document.getElementById("resetAllBtn"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  donateLink: document.getElementById("donateLink"),
  body: document.body,
  pausedOverlay: document.getElementById("pausedOverlay"),
};

export { CONFIG, ALL_STORAGE_KEYS, elements };