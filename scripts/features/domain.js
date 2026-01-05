import { CONFIG, ALL_STORAGE_KEYS } from "../worker/config.js";
import { elements } from "../popup/elements.js";
import { isValidDomain, extractHostname, saveToList } from "../helpers.js";
import { reapplyRules } from "../worker/rules.js";
import { checkAndReloadActiveTab } from "../reload.js";
import { renderList, triggerInputError } from "../ui/render.js";

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

export { handleAddDomain, handleRemoveDomain };
