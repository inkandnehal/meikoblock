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

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const state = await chrome.storage.local.get(
    Object.values(CONFIG.STORAGE_KEYS)
  );

  // Settings
  const blockSubdomainsByDefault = document.getElementById(
    "blockSubdomainsByDefault"
  );
  const focusAnimations = document.getElementById("focusAnimations");

  if (blockSubdomainsByDefault)
    blockSubdomainsByDefault.checked =
      state[CONFIG.STORAGE_KEYS.BLOCK_SUBDOMAINS] ??
      CONFIG.DEFAULTS.blockSubdomains;
  if (focusAnimations)
    focusAnimations.checked =
      state[CONFIG.STORAGE_KEYS.DISABLE_FOCUS_ANIMATIONS] ??
      CONFIG.DEFAULTS.disableFocusAnimations;
  if (focusAnimations.checked) {
    document.body.classList.toggle("focus-disabled", focusAnimations.checked);
  }
  renderUI(state);

  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (activeTab?.url && activeTab.url.startsWith("http")) {
    const hostname = extractHostname(activeTab.url);
    if (hostname && !hostname.startsWith("*.") && isValidDomain(hostname)) {
      elements.domainInput.value = hostname;
      elements.domainInput.select();
    }
  }

  attachEventListeners();
}

function attachEventListeners() {
  elements.donateLink?.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL("pages/donate.html") });
  });

  elements.powerBtn.addEventListener("click", togglePower);
  elements.panicToggle.addEventListener("change", togglePanicMode);
  elements.addBtn.addEventListener("click", handleAddDomain);
  elements.settingsBtn.addEventListener("click", handleSettings);
  elements.resetAllBtn.addEventListener("click", handleSettings);
  elements.closeSettingsBtn.addEventListener("click", handleSettings);

  elements.domainInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAddDomain();
  });

  elements.domainInput.addEventListener("input", () => {
    elements.domainInput.classList.remove("input-error");
  });
}

// --- Core Logic ---

async function handleAddDomain() {
  const { isPaused, panicMode } = await chrome.storage.local.get([
    "isPaused",
    "panicMode",
  ]);
  if (isPaused) return;

  const rawInput = elements.domainInput.value.trim();
  const hostname = extractHostname(rawInput);

  if (!hostname || !isValidDomain(hostname)) {
    triggerInputError();
    return;
  }

  const ruleId =
    Math.floor(Date.now() % CONFIG.MAX_ID_RANGE) +
    Math.floor(Math.random() * 1000);
  const listKey = panicMode ? "whitelistedSites" : "blockedSites";

  try {
    await saveToList(listKey, { id: ruleId, domain: hostname });

    if (!isPaused) {
      await reapplyRules();
      await checkAndReloadActiveTab(hostname, panicMode);
    }

    elements.domainInput.value = "";
    const state = await chrome.storage.local.get(ALL_STORAGE_KEYS);
    renderList(state);
  } catch (error) {
    console.error("Add domain error:", error);
  }
}

async function handleRemoveDomain(id, domain) {
  const { isPaused, panicMode } = await chrome.storage.local.get([
    "isPaused",
    "panicMode",
  ]);
  if (isPaused) return;

  try {
    // 1. We remove the main ID, plus the +1 and +2 offsets used for fallback rules.
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [id, id + 1, id + 2],
    });

    // 2. Update Storage (Triggers block.js listener)
    const listKey = panicMode ? "whitelistedSites" : "blockedSites";
    const data = await chrome.storage.local.get(listKey);
    const updatedList = (data[listKey] || []).filter((item) => item.id !== id);
    await chrome.storage.local.set({ [listKey]: updatedList });

    // 3. Full Cleanup (Syncs everything else)
    await reapplyRules();

    const state = await chrome.storage.local.get(ALL_STORAGE_KEYS);
    renderList(state);
  } catch (error) {
    console.error("Remove domain error:", error);
  }
}

async function togglePower() {
  const { isPaused } = await chrome.storage.local.get("isPaused");
  const newState = !isPaused;

  if (newState) {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    const ids = rules.map((r) => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ids,
    });
    await chrome.storage.local.set({ isPaused: newState });
  } else {
    await chrome.storage.local.set({ isPaused: newState });
    await reapplyRules();

    const { panicMode } = await chrome.storage.local.get("panicMode");
    if (panicMode) {
      await forceReloadIfPanic();
    } else {
      chrome.tabs.reload();
    }
  }

  const state = await chrome.storage.local.get(ALL_STORAGE_KEYS);
  renderUI(state);
}

async function handleSettings(e) {
  switch (e.target.id) {
    case "settingsBtn":
      document.getElementById("settingsOverlay").classList.contains("hidden")
        ? document.getElementById("settingsOverlay").classList.remove("hidden")
        : document.getElementById("settingsOverlay").classList.add("hidden");

      break;
    case "resetAllBtn":
      const keys = CONFIG.STORAGE_KEYS;
      await chrome.storage.local.set({
        [keys.BLOCK_SUBDOMAINS]: CONFIG.DEFAULTS.blockSubdomains,
        [keys.DISABLE_FOCUS_ANIMATIONS]: CONFIG.DEFAULTS.disableFocusAnimations,
        [keys.BLOCKED_SITES]: [],
        [keys.WHITELISTED_SITES]: [],
      });

      document.getElementById("blockSubdomainsByDefault").checked = false;
      document.getElementById("focusAnimations").checked = false;

      await reapplyRules();
      renderUI(await chrome.storage.local.get(ALL_STORAGE_KEYS));
      break;
    case "closeSettingsBtn":
      document.getElementById("settingsOverlay").classList.add("hidden");

      const blockSubdomainsByDefault = document.getElementById(
        "blockSubdomainsByDefault"
      );
      const focusAnimations = document.getElementById("focusAnimations");
      document.body.classList.toggle("focus-disabled", focusAnimations.checked);
      await chrome.storage.local.set({
        [CONFIG.STORAGE_KEYS.BLOCK_SUBDOMAINS]:
          blockSubdomainsByDefault.checked,
        [CONFIG.STORAGE_KEYS.DISABLE_FOCUS_ANIMATIONS]: focusAnimations.checked,
      });

      await reapplyRules();
      renderUI(await chrome.storage.local.get(ALL_STORAGE_KEYS));
      break;
  }
}

async function togglePanicMode() {
  const isPanicMode = this.checked;
  await chrome.storage.local.set({ panicMode: isPanicMode });

  const { isPaused } = await chrome.storage.local.get("isPaused");
  if (!isPaused) {
    await reapplyRules();
    if (isPanicMode) {
      await forceReloadIfPanic();
    }
  }
  renderUI(await chrome.storage.local.get(ALL_STORAGE_KEYS));
}

// --- Reload Logic ---

async function checkAndReloadActiveTab(addedDomain, isPanicMode) {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!activeTab || !activeTab.url || activeTab.url.startsWith("chrome"))
    return;

  const currentHost = new URL(activeTab.url).hostname.replace(/^www\./, "");
  if (!isPanicMode && matchDomain(currentHost, addedDomain)) {
    chrome.tabs.reload(activeTab.id);
  }
}

async function forceReloadIfPanic() {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!activeTab || !activeTab.url || activeTab.url.startsWith("chrome"))
    return;

  const { whitelistedSites } = await chrome.storage.local.get(
    "whitelistedSites"
  );
  const currentHost = new URL(activeTab.url).hostname.replace(/^www\./, "");

  const isSafe = (whitelistedSites || []).some((site) =>
    matchDomain(currentHost, site.domain)
  );
  if (!isSafe) {
    chrome.tabs.reload(activeTab.id);
  }
}

async function matchDomain(currentUrl, ruleDomain) {
  const result = await chrome.storage.local.get(
    CONFIG.STORAGE_KEYS.BLOCK_SUBDOMAINS
  );

  const blockSubdomains =
    result[CONFIG.STORAGE_KEYS.BLOCK_SUBDOMAINS] ??
    CONFIG.DEFAULTS.blockSubdomains;

  if (ruleDomain.startsWith("*.")) {
    const base = ruleDomain.substring(2);
    return currentUrl === base || currentUrl.endsWith("." + base);
  }

  if (currentUrl === ruleDomain) return true;
  if (!blockSubdomains) return false;

  return currentUrl.endsWith("." + ruleDomain);
}

// --- Rule Engine ---

async function reapplyRules() {
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = currentRules.map((r) => r.id);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
  });

  const state = await chrome.storage.local.get(ALL_STORAGE_KEYS);

  const blockSubdomains =
    state[CONFIG.STORAGE_KEYS.BLOCK_SUBDOMAINS] ??
    CONFIG.DEFAULTS.blockSubdomains;
  const panicMode = state.panicMode;
  const whitelistedSites = state.whitelistedSites;
  const blockedSites = state.blockedSites;

  const extensionId = chrome.runtime.id;
  const newRules = [];

  if (panicMode) {
    // Panic
    newRules.push({
      id: CONFIG.PANIC_RULE_ID,
      priority: CONFIG.PRIORITY_SIMPLE_REDIRECT,
      action: {
        type: "redirect",
        redirect: {
          regexSubstitution: `chrome-extension://${extensionId}/pages/block.html?from=\\1`,
        },
      },
      condition: {
        regexFilter: "^(https?://.*)$",
        resourceTypes: ["main_frame"],
      },
    });

    (whitelistedSites || []).forEach((site) => {
      const pattern = generateRegexForDomain(site.domain, blockSubdomains);
      newRules.push({
        id: site.id,
        priority: CONFIG.PRIORITY_SAFE,
        action: { type: "allow" },
        condition: {
          regexFilter: pattern,
          resourceTypes: ["main_frame", "xmlhttprequest"],
        },
      });
    });
  } else {
    // Normal
    (blockedSites || []).forEach((site) => {
      const pattern = generateRegexForDomain(site.domain, blockSubdomains);

      // Rule 1: Fancy Redirect (Priority 5000)
      newRules.push({
        id: site.id,
        priority: CONFIG.PRIORITY_FANCY_REDIRECT,
        action: {
          type: "redirect",
          redirect: {
            regexSubstitution: `chrome-extension://${extensionId}/pages/block.html?from=\\1`,
          },
        },
        condition: { regexFilter: pattern, resourceTypes: ["main_frame"] },
      });

      // Rule 2: Simple Fallback (Priority 4000)
      newRules.push({
        id: site.id + 1,
        priority: CONFIG.PRIORITY_SIMPLE_REDIRECT,
        action: {
          type: "redirect",
          redirect: { extensionPath: "/pages/block.html" },
        },
        condition: {
          ...(blockSubdomains
            ? { urlFilter: `||${site.domain.replace(/^\*\./, "")}` }
            : { regexFilter: pattern }),
          resourceTypes: ["main_frame"],
        },
      });

      // Rule 3: Hard Block (Priority 1)
      newRules.push({
        id: site.id + 2,
        priority: CONFIG.PRIORITY_HARD_BLOCK,
        action: { type: "block" },
        condition: {
          regexFilter: pattern,
          resourceTypes: ["xmlhttprequest", "sub_frame", "script"],
        },
      });
    });
  }

  if (newRules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: newRules,
    });
  }
}

// --- Helpers ---

function generateRegexForDomain(rawDomain, blockSubdomains = false) {
  let domain = rawDomain.replace(/^https?:\/\//, "");
  let isWildcard = false;

  if (domain.startsWith("*.")) {
    isWildcard = true;
    domain = domain.substring(2);
  }

  const safeDomain = escapeRegex(domain);

  if (isWildcard || blockSubdomains) {
    return `^(https?://(?:[^/]+\\.)*${safeDomain}(?:/.*)?)$`;
  }

  return `^(https?://(?:www\\.)?${safeDomain}(?:/.*)?)$`;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isValidDomain(domain) {
  if (!domain) return false;
  return CONFIG.DOMAIN_REGEX.test(domain) || domain === "localhost";
}

function extractHostname(url) {
  if (!url) return null;
  if (url.startsWith("*.")) {
    const rest = url.substring(2);
    if (CONFIG.DOMAIN_REGEX.test(rest)) return url;
  }

  let formattedUrl = url.trim().toLowerCase();
  if (!formattedUrl.startsWith("http") && !formattedUrl.startsWith("*.")) {
    formattedUrl = "http://" + formattedUrl;
  }

  try {
    const urlObj = new URL(formattedUrl);
    return urlObj.hostname.replace(/^www\./, "");
  } catch (e) {
    return CONFIG.DOMAIN_REGEX.test(url) ? url : null;
  }
}

async function saveToList(key, item) {
  const data = await chrome.storage.local.get(key);
  const list = data[key] || [];
  if (list.some((i) => i.domain === item.domain)) return;
  list.push(item);
  await chrome.storage.local.set({ [key]: list });
}

function triggerInputError() {
  elements.domainInput.classList.add("input-error");
  elements.domainInput.focus();
}

function renderUI(state) {
  const isPaused = state.isPaused || false;
  const isPanicMode = state.panicMode || false;

  elements.body.classList.toggle("is-paused", isPaused);
  elements.body.classList.toggle("panic-active", isPanicMode);
  elements.pausedOverlay.classList.toggle("hidden", !isPaused);
  elements.panicToggle.checked = isPanicMode;
  elements.powerBtn.title = isPaused ? "System Paused" : "System Active";

  if (isPanicMode) {
    elements.addBtn.textContent = "Add to Safe List";
    elements.listTitle.textContent = "Safe Sites (Others are blocked):";
    elements.domainInput.placeholder = "Enter safe domain...";
  } else {
    elements.addBtn.textContent = "Block Site";
    elements.listTitle.textContent = "Blocked (Use *. for subdomains):";
    elements.domainInput.placeholder = "e.g. google.com or *.google.com";
  }
  renderList(state);
}

function renderList(state) {
  const listKey = state.panicMode ? "whitelistedSites" : "blockedSites";
  const list = state[listKey] || [];
  elements.siteList.innerHTML = "";

  if (list.length === 0) {
    elements.siteList.innerHTML = `<li class='placeholder-item'>${
      state.panicMode ? "No safe sites added." : "No blocked sites."
    }</li>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  list.forEach((item) => {
    const li = document.createElement("li");
    li.className = "item";
    const span = document.createElement("span");
    span.textContent = item.domain;

    const btn = document.createElement("button");
    btn.className = "btn-remove";
    btn.textContent = "✕";
    btn.onclick = () => handleRemoveDomain(item.id, item.domain);

    li.appendChild(span);
    li.appendChild(btn);
    fragment.appendChild(li);
  });
  elements.siteList.appendChild(fragment);
}
