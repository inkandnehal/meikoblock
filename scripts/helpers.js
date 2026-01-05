import { CONFIG } from "./worker/config.js";

export async function matchDomain(currentUrl, ruleDomain) {
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

export function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function generateRegexForDomain(rawDomain, blockSubdomains = false) {
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

export function isValidDomain(domain) {
  if (!domain) return false;
  return CONFIG.DOMAIN_REGEX.test(domain) || domain === "localhost";
}

export function extractHostname(url) {
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

export async function saveToList(key, item) {
  const data = await chrome.storage.local.get(key);
  const list = data[key] || [];
  if (list.some((i) => i.domain === item.domain)) return;
  list.push(item);
  await chrome.storage.local.set({ [key]: list });
}
