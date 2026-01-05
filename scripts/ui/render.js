import { elements } from "../popup/elements.js";
import { handleRemoveDomain } from "../features/domain.js";

function triggerInputError() {
  elements.domainInput.classList.add("input-error");
  elements.domainInput.focus();
}

function renderUI(state) {
  const isPaused = state.isPaused || false;
  const isPanicMode = state.panicMode || false;

  elements.body.classList.toggle("is-paused", isPaused);
  elements.body.classList.toggle("panic-active", isPanicMode);
  elements.pausedOverlay.classList.toggle("hidden", !isPaused);
  elements.panicToggle.checked = isPanicMode;
  elements.powerBtn.title = isPaused ? "System Paused" : "System Active";

  if (isPanicMode) {
    elements.addBtn.textContent = "Add to Safe List";
    elements.listTitle.textContent = "Safe Sites (Others are blocked):";
    elements.domainInput.placeholder = "Enter safe domain...";
  } else {
    elements.addBtn.textContent = "Block Site";
    elements.listTitle.textContent = "Blocked (Use *. for subdomains):";
    elements.domainInput.placeholder = "e.g. google.com or *.google.com";
  }
  renderList(state);
}

function renderList(state) {
  const listKey = state.panicMode ? "whitelistedSites" : "blockedSites";
  const list = state[listKey] || [];
  elements.siteList.innerHTML = "";

  if (list.length === 0) {
    elements.siteList.innerHTML = `<li class='placeholder-item'>${
      state.panicMode ? "No safe sites added." : "No blocked sites."
    }</li>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  list.forEach((item) => {
    const li = document.createElement("li");
    li.className = "item";
    const span = document.createElement("span");
    span.textContent = item.domain;

    const btn = document.createElement("button");
    btn.className = "btn-remove";
    btn.textContent = "✕";
    btn.onclick = () => handleRemoveDomain(item.id, item.domain);

    li.appendChild(span);
    li.appendChild(btn);
    fragment.appendChild(li);
  });
  elements.siteList.appendChild(fragment);
}

export { triggerInputError, renderUI, renderList };