import { reapplyRules } from "../worker/rules.js";
import { forceReloadIfPanic } from "../reload.js";
import { ALL_STORAGE_KEYS } from "../worker/config.js";
import { renderUI } from "../ui/render.js";

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

export { togglePower };
