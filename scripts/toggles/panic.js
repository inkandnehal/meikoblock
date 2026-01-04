import { reapplyRules } from "../worker/rules.js";
import { forceReloadIfPanic } from "../reload.js";
import { renderUI } from "../ui/render.js";
import { ALL_STORAGE_KEYS } from "../worker/config.js";


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

export { togglePanicMode };