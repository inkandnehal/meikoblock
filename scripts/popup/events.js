import { elements } from "./elements.js";
import { togglePower } from "../toggles/power.js";
import { togglePanicMode } from "../toggles/panic.js";
import { handleAddDomain } from "../features/domain.js";
import { handleSettings } from "../features/settings.js";

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

export { attachEventListeners };