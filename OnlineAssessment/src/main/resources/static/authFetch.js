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

