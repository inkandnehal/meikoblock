import { CONFIG, ALL_STORAGE_KEYS } from "../worker/config.js";
import { reapplyRules } from "../worker/rules.js";
import { renderUI } from "../ui/render.js";


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

export { handleSettings };