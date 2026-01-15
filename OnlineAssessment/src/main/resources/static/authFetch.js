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
        ...(token ? { Authorization: "Bearer " + token } : {})
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401 || response.status === 403) {
        showSessionExpiredModal();
        throw new Error("Session expired");
    }

    return response;
}
