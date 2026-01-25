const roleCards = document.querySelectorAll(".role-card[data-role]");
const roleSelection = document.getElementById("roleSelection");
const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");

const studentFields = document.getElementById("studentFields");
const facultyFields = document.getElementById("facultyFields");
const adminFields = document.getElementById("adminFields");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const backBtn = document.getElementById("backBtn");
const loginTitle = document.getElementById("loginTitle");

const welcomeMsg = document.getElementById("welcomeMsg");
const studentDashboard = document.getElementById("studentDashboard");
const facultyDashboard = document.getElementById("facultyDashboard");
const adminDashboard = document.getElementById("adminDashboard");

let selectedRole = null;
let loggedInUser = null;

// -------------------- HELPER: SECTION SWITCHING --------------------
function showSection(sectionId) {
    // List of all main sections
    const sections = [roleSelection, loginSection, dashboard];

    sections.forEach(sec => {
        if (sec.id === sectionId) {
            sec.classList.remove("hidden-section");
            sec.classList.add("active-section");
        } else {
            sec.classList.add("hidden-section");
            sec.classList.remove("active-section");
        }
    });
}

// -------------------- ROLE CARD SELECTION --------------------
roleCards.forEach(card => {
    card.addEventListener("click", () => {
        selectedRole = card.dataset.role;

        // Reset inputs
        studentFields.querySelectorAll("input").forEach(i => i.value = "");
        facultyFields.querySelectorAll("input").forEach(i => i.value = "");
        adminFields.querySelectorAll("input").forEach(i => i.value = "");
        loginError.textContent = "";

        // Show appropriate fields
        studentFields.style.display = "none";
        facultyFields.style.display = "none";
        adminFields.style.display = "none";

        if (selectedRole === "student") studentFields.style.display = "block";
        if (selectedRole === "faculty") facultyFields.style.display = "block";
        if (selectedRole === "admin") adminFields.style.display = "block";

        loginTitle.textContent = `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login`;

        // Switch to login view
        showSection("loginSection");
    });
});

// -------------------- BACK BUTTON --------------------
backBtn.addEventListener("click", () => {
    selectedRole = null;
    loginError.textContent = "";
    showSection("roleSelection");
});

// -------------------- LOGIN LOGIC --------------------
loginBtn.addEventListener("click", async () => {
    loginError.textContent = "";
    let url = "";
    let payload = {};

    if (selectedRole === "student") {
        const roll = document.getElementById("studentRoll").value.trim();
        const pass = document.getElementById("studentPassword").value.trim();
        if (!roll || !pass) { loginError.textContent = "Please fill all fields!"; return; }
        payload = { studentRollNumber: roll, password: pass };
        url = "/student/validate";

    } else if (selectedRole === "faculty") {
        const email = document.getElementById("facultyEmail").value.trim();
        const pass = document.getElementById("facultyPassword").value.trim();
        if (!email || !pass) { loginError.textContent = "Please fill all fields!"; return; }
        payload = { email: email, password: pass };
        url = "/faculty/validate";

    } else if (selectedRole === "admin") {
        const username = document.getElementById("adminUsername").value.trim();
        const password = document.getElementById("adminPassword").value.trim();
        if (!username || !password) { loginError.textContent = "Please fill all fields!"; return; }
        payload = { username: username, password: password };
        url = "/admin/validate";

    } else {
        loginError.textContent = "Please select a role!";
        return;
    }

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const responseData = await res.json();

            sessionStorage.setItem("token", responseData.token);
            delete responseData.token;

            loggedInUser = responseData;
            sessionStorage.setItem("user", JSON.stringify(loggedInUser));
            sessionStorage.setItem("role", selectedRole);

            loginError.style.color = "green";
            loginError.textContent = "Login Successful!";

            // Set Student Roll if needed
            if (selectedRole === "student" && typeof window.setStudentRoll === "function") {
                window.setStudentRoll(loggedInUser.rollNumber);
            }

            setTimeout(() => {
                showDashboard();
            }, 500);

        } else {
            loginError.style.color = "red";
            loginError.textContent = await res.text();
        }
    } catch (err) {
        loginError.style.color = "red";
        loginError.textContent = "Server error: " + err.message;
    }
});

// -------------------- SHOW DASHBOARD --------------------
// -------------------- SHOW DASHBOARD --------------------
function showDashboard() {
    // Date for welcome card
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let welcomeHTML = `
        <div class="welcome-card">
            <div class="welcome-text">
                <h2>Hello, <span class="{ROLE}-name">{NAME}</span>!</h2>
                <p>Welcome back to your dashboard. Ready to achieve something great today?</p>
            </div>
            <div class="welcome-date">${today}</div>
        </div>
    `;

    // Find or create welcome container
    let header = document.querySelector(".dashboard-header");

    if (header) {
        if (selectedRole === "student") {
            header.innerHTML = welcomeHTML.replace("{NAME}", loggedInUser.name).replace("{ROLE}", "student");
        }
        else if (selectedRole === "faculty") {
            header.innerHTML = welcomeHTML.replace("{NAME}", loggedInUser.facultyName).replace("{ROLE}", "faculty");
        }
        else {
            header.innerHTML = welcomeHTML.replace("{NAME}", loggedInUser.username).replace("{ROLE}", "admin");
        }
    }

    // Toggle Dashboard Cards
    studentDashboard.classList.add("hidden");
    facultyDashboard.classList.add("hidden");
    adminDashboard.classList.add("hidden");

    if (selectedRole === "student") studentDashboard.classList.remove("hidden");
    if (selectedRole === "faculty") facultyDashboard.classList.remove("hidden");
    if (selectedRole === "admin") adminDashboard.classList.remove("hidden");

    // ----- PROFILE MENU LOGIC -----
    const profileMenu = document.getElementById("profileMenu");
    const publicNavLinks = document.getElementById("publicNavLinks");
    const profileDropdown = document.getElementById("profileDropdown");
    const headerUserName = document.getElementById("headerUserName");

    if (profileMenu) profileMenu.classList.remove("hidden");
    // Optionally keep public links or hide them. "Add About Us and Contact us on the top" suggests they should stay visible.
    // if(publicNavLinks) publicNavLinks.classList.add("hidden"); 

    let profileHtml = "";

    if (selectedRole === "student") {
        headerUserName.textContent = loggedInUser.name || "Student";
        profileHtml = `
            <div class="profile-header">
                <span class="p-name">${loggedInUser.name || "Student"}</span>
                <span class="p-role">Student</span>
            </div>
            <div class="profile-details">
                <p><strong>Roll:</strong> ${loggedInUser.rollNumber || "N/A"}</p>
                <p><strong>Dept:</strong> ${loggedInUser.department || "N/A"}</p>
                <p><strong>Section:</strong> ${loggedInUser.section || "N/A"}</p>
            </div>
            <div class="profile-actions">
                <button class="menu-btn btn-logout" id="dropdownLogout">
                    <span>🚪</span> Logout
                </button>
            </div>
        `;
    } else if (selectedRole === "faculty") {
        const name = loggedInUser.facultyName || "Faculty";
        headerUserName.textContent = name;

        profileHtml = `
            <div class="profile-header">
                <span class="p-name">${name}</span>
                <span class="p-role">Faculty</span>
            </div>
            <div class="profile-details">
                <p><strong>Email:</strong> ${loggedInUser.email || "N/A"}</p>
                <p><strong>Dept:</strong> ${loggedInUser.department || "N/A"}</p>
                 ${loggedInUser.facultyId ? `<p><strong>ID:</strong> ${loggedInUser.facultyId}</p>` : ''}
            </div>
            <div class="profile-actions">
                 <button class="menu-btn" onclick="location.href='faculty_help.html'">
                    <span>❓</span> Help
                </button>
                <button class="menu-btn btn-logout" id="dropdownLogout">
                    <span>🚪</span> Logout
                </button>
            </div>
        `;
    } else if (selectedRole === "admin") {
        const name = loggedInUser.username || "Admin";
        headerUserName.textContent = name;
        profileHtml = `
            <div class="profile-header">
                <span class="p-name">${name}</span>
                <span class="p-role">Admin</span>
            </div>
            <div class="profile-actions">
                <button class="menu-btn btn-logout" id="dropdownLogout">
                    <span>🚪</span> Logout
                </button>
            </div>
        `;
    }

    if (profileDropdown) {
        profileDropdown.innerHTML = profileHtml;
        profileDropdown.classList.remove("show"); // Ensure it starts closed
        // Bind Logout
        document.getElementById("dropdownLogout")?.addEventListener("click", logout);
    }

    // Switch View
    showSection("dashboard");
}

// -------------------- LOGOUT --------------------
function logout() {
    loggedInUser = null;
    selectedRole = null;
    sessionStorage.clear();

    // Hide Profile Menu and Dropdown
    const profileMenu = document.getElementById("profileMenu");
    const profileDropdown = document.getElementById("profileDropdown");

    if (profileMenu) profileMenu.classList.add("hidden");
    if (profileDropdown) profileDropdown.classList.remove("show");

    // Reset Header Name
    const headerUserName = document.getElementById("headerUserName");
    if (headerUserName) headerUserName.textContent = "Profile";

    showSection("roleSelection");
}

// -------------------- INIT --------------------
window.addEventListener("load", () => {
    const savedRole = sessionStorage.getItem("role");
    const savedUser = sessionStorage.getItem("user");

    if (savedRole && savedUser) {
        selectedRole = savedRole;
        loggedInUser = JSON.parse(savedUser);

        if (selectedRole === "student" && loggedInUser.rollNumber && typeof window.setStudentRoll === "function") {
            window.setStudentRoll(loggedInUser.rollNumber);
        }
        showDashboard();
    } else {
        showSection("roleSelection");
    }
});

// -------------------- PASSWORD TOGGLE --------------------
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("toggle-password")) {
        const inputId = e.target.dataset.target;
        const input = document.getElementById(inputId);
        if (input.type === "password") {
            input.type = "text";
            e.target.textContent = "🙈";
        } else {
            input.type = "password";
            e.target.textContent = "👁️";
        }
    }
});

// -------------------- PROFILE DROPDOWN LOGIC --------------------
// Toggle on click
document.addEventListener("click", function (e) {
    const trigger = e.target.closest("#profileTrigger");
    const dropdown = document.getElementById("profileDropdown");
    const profileMenu = document.getElementById("profileMenu");

    // Only work if profileMenu is visible (i.e. logged in)
    if (profileMenu && !profileMenu.classList.contains("hidden")) {
        if (trigger) {
            // Toggle
            if (dropdown) dropdown.classList.toggle("show");
            e.stopPropagation();
        } else {
            // Close if clicking outside
            if (dropdown && dropdown.classList.contains("show") && !e.target.closest("#profileDropdown")) {
                dropdown.classList.remove("show");
            }
        }
    }
});




