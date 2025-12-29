document.addEventListener("DOMContentLoaded", () => {
    // 1. Robust URL Extractor
    const getOriginalUrl = () => {
        const rawQuery = window.location.search;
        const paramName = "from=";
        const index = rawQuery.indexOf(paramName);
        if (index === -1) return null;
        return rawQuery.substring(index + paramName.length);
    };

    const fromUrl = getOriginalUrl();
    const backBtn = document.getElementById("backBtn");
    const msgEl = document.querySelector(".message-box h2");

    if (msgEl) {
        const messages = ["Meiko says NO.", "Focus!", "(҂ ` ﾛ ´)σ DENIED!", "Do your work."];
        msgEl.textContent = messages[Math.floor(Math.random() * messages.length)];
    }

    if (backBtn) {
        backBtn.addEventListener("click", () => {
            if (history.length > 1) history.back();
            else window.close();
        });
    }

    // 2. Auto-Redirect Logic
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local") {
            // Case A: System Paused
            if (changes.isPaused && changes.isPaused.newValue === true) {
                if (fromUrl) window.location.href = fromUrl;
            }
            
            // Case B: Panic Mode OFF
            if (changes.panicMode && changes.panicMode.newValue === false) {
                 if (fromUrl) window.location.href = fromUrl;
            }

            // Case C: Site Removed from list
            if (changes.blockedSites && fromUrl) {
                const newList = changes.blockedSites.newValue || [];
                try {
                    let currentDomain = new URL(fromUrl).hostname.replace(/^www\./, "");
                    
                    const stillBlocked = newList.some(site => {
                        if (site.domain.startsWith("*.")) {
                             const base = site.domain.substring(2);
                             return currentDomain.endsWith(base);
                        }
                        return site.domain === currentDomain;
                    });
                    
                    if (!stillBlocked) {
                        window.location.href = fromUrl;
                    }
                } catch(e) {}
            }
        }
    });
});