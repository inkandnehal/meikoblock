/**
 * Popup Logic
 * Fixes: "Race Condition" on remove. Removes blocking rule BEFORE signaling redirect.
 */

export const CONFIG = {
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
    DISABLE_FOCUS_ANIMATIONS: "disableFocusAnimations",
    BLOCK_DISTRACTION_SITES: "blockDistractionSites",
  },

  // Hidden Settings (Settings that the user doesn't need to know but is used for special features)
  HIDDEN_SETTINGS: {
    DISTRACTION_SITES: "distractionSites",
  },

  // Default Settings
  DEFAULTS: {
    blockedSites: [],
    whitelistedSites: [],
    panicMode: false,
    isPaused: false,
    blockSubdomains: false,
    disableFocusAnimations: false,
    blockDistractionSites: false,
    distractionSites: [
      "facebook.com",
      "instagram.com",
      "twitter.com",
      "x.com",
      "threads.net",
      "tiktok.com",
      "snapchat.com",
      "reddit.com",
      "pinterest.com",
      "tumblr.com",
      "linkedin.com",

      "youtube.com",
      "twitch.tv",
      "kick.com",
      "netflix.com",
      "hulu.com",
      "disneyplus.com",
      "primevideo.com",
      "hbomax.com",
      "paramountplus.com",
      "peacocktv.com",
      "crunchyroll.com",
      "funimation.com",

      "roblox.com",
      "minecraft.net",
      "epicgames.com",
      "steampowered.com",
      "steamcommunity.com",
      "playstation.com",
      "xbox.com",
      "riotgames.com",
      "leagueoflegends.com",
      "blizzard.com",

      "quora.com",
      "medium.com",
      "dev.to",
      "news.ycombinator.com",

      "cnn.com",
      "bbc.com",
      "nytimes.com",
      "washingtonpost.com",
      "foxnews.com",
      "news.google.com",

      "amazon.com",
      "ebay.com",
      "etsy.com",
      "aliexpress.com",
      "walmart.com",
      "bestbuy.com",
      "target.com",

      "9gag.com",
      "knowyourmeme.com",
      "buzzfeed.com",
      "thechive.com",
      "boredpanda.com",
    ],
  },

  MAX_ID_RANGE: 800000,
  DOMAIN_REGEX:
    /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
};

// Storage Keys Helper
export const ALL_STORAGE_KEYS = Object.values({
  ...CONFIG.STORAGE_KEYS,
  ...CONFIG.HIDDEN_SETTINGS,
});
