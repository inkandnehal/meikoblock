import { matchDomain } from "./helpers.js";

export async function checkAndReloadActiveTab(addedDomain, isPanicMode) {
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

export async function forceReloadIfPanic() {
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
