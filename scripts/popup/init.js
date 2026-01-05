import { CONFIG } from "../worker/config.js";
import { elements } from "./elements.js";
import { extractHostname, isValidDomain } from "../helpers.js";
import { renderUI } from "../ui/render.js";
import { attachEventListeners } from "./events.js";

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

export { init };
