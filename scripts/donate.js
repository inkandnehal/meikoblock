/**
 * Donation Page Scripts
 * Handles clipboard interactions with visual feedback.
 */

document.addEventListener("DOMContentLoaded", () => {
    const elements = {
        copyBtn: document.getElementById("copyBtn"),
        walletAddress: document.querySelector(".js-wallet-address"),
        btnText: document.getElementById("btnText")
    };

    if (!elements.copyBtn || !elements.walletAddress) return;

    elements.copyBtn.addEventListener("click", () => copyToClipboard(elements));
});

async function copyToClipboard({ walletAddress, btnText, copyBtn }) {
    const address = walletAddress.textContent.trim();

    try {
        await navigator.clipboard.writeText(address);
        triggerSuccessState(btnText, copyBtn);
    } catch (err) {
        console.error("Clipboard write failed:", err);
        
        // Fallback for older browsers or if permission is denied
        fallbackCopyText(address);
        alert("Could not copy automatically. Please copy the address manually.");
    }
}

function triggerSuccessState(textElement, btnElement) {
    const originalText = textElement.textContent;
    
    // Update UI
    textElement.textContent = "Copied!";
    btnElement.classList.add("success");

    // Reset after 2 seconds
    setTimeout(() => {
        textElement.textContent = originalText;
        btnElement.classList.remove("success");
    }, 2000);
}

function fallbackCopyText(text) {
    // Basic fallback using textarea hack if navigator fails
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("Copy");
    textArea.remove();
}