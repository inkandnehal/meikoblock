import { CONFIG, ALL_STORAGE_KEYS } from "./config.js";
import { generateRegexForDomain } from "../helpers.js";

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
  const blockedSites = state.blockedSites ?? [];
  const distractionSites = state.distractionSites ?? [];
  const blockDistractionSites = true;

  const extensionId = chrome.runtime.id;
  const newRules = [];

  let effectiveBlockedSites = [...blockedSites];

  if (blockDistractionSites) {
    const distractionRules = distractionSites.map((domain, index) => ({
      id: CONFIG.MAX_ID_RANGE + index * 3,
      domain,
    }));

    console.log(distractionSites)

    effectiveBlockedSites = effectiveBlockedSites.concat(distractionRules);
    console.log(effectiveBlockedSites)
  }

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
    effectiveBlockedSites.forEach((site) => {
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

export { reapplyRules };
