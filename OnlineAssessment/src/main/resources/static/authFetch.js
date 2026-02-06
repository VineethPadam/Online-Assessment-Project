function getAuthToken() {
    return sessionStorage.getItem("token");
}

function showSessionExpiredModal() {
    const modal = document.getElementById("sessionExpiredModal");
    modal.classList.remove("hidden");

    document.getElementById("sessionExpiredBtn").onclick = () => {
        sessionStorage.clear();
        location.reload();
    };
}

async function authFetch(url, options = {}) {
    const token = getAuthToken();

    const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    let response;
    try {
        response = await fetch(url, { ...options, headers });
    } catch (err) {
        console.error("Network error:", err);
        throw err;
    }

    if (response.status === 401) {
        showSessionExpiredModal();
        return Promise.reject("Session expired");
    }

    return response;
}

// Global System Modals
window.showAlert = (message, title = "Security Alert", icon = "⚠️") => {
    const overlay = document.createElement("div");
    overlay.className = "system-alert-overlay";
    overlay.innerHTML = `
    <div class="system-alert-card">
      <span class="system-alert-icon">${icon}</span>
      <h2 class="system-alert-title">${title}</h2>
      <p class="system-alert-message">${message}</p>
      <button class="system-alert-btn">Acknowledge</button>
    </div>
  `;
    document.body.appendChild(overlay);
    overlay.querySelector("button").onclick = () => overlay.remove();
};

window.showConfirm = (message, title = "Confirmation Required") => {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "system-alert-overlay";
        overlay.innerHTML = `
      <div class="system-alert-card">
        <h2 class="system-alert-title">${title}</h2>
        <p class="system-alert-message">${message}</p>
        <div class="system-confirm-btns">
          <button id="sysCancel" class="system-alert-btn system-confirm-btn-cancel">Cancel</button>
          <button id="sysOk" class="system-alert-btn">Proceed</button>
        </div>
      </div>
    `;
        document.body.appendChild(overlay);
        overlay.querySelector("#sysCancel").onclick = () => { overlay.remove(); resolve(false); };
        overlay.querySelector("#sysOk").onclick = () => { overlay.remove(); resolve(true); };
    });
};

