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
const landingSection = document.getElementById("landingSection");
const loginTitle = document.getElementById("loginTitle");
const loginNavBtn = document.getElementById("loginNavBtn");
const homeNavBtn = document.getElementById("homeNavBtn");
const homeLogo = document.getElementById("homeLogo");

const welcomeMsg = document.getElementById("welcomeMsg");
const studentDashboard = document.getElementById("studentDashboard");
const facultyDashboard = document.getElementById("facultyDashboard");
const adminDashboard = document.getElementById("adminDashboard");

let selectedRole = null;
let loggedInUser = null;

// -------------------- HELPER: SECTION SWITCHING --------------------
function showSection(sectionId) {
    // List of all main sections
    const sections = [landingSection, roleSelection, loginSection, dashboard];

    sections.forEach(sec => {
        if (sec && sec.id === sectionId) {
            sec.classList.remove("hidden-section");
            sec.classList.add("active-section");
        } else if (sec) {
            sec.classList.add("hidden-section");
            sec.classList.remove("active-section");
        }
    });

    // Update active state in nav
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    if (sectionId === 'landingSection') {
        homeNavBtn?.classList.add('active');
    }
}

// -------------------- ROLE CARD SELECTION --------------------
// (Role cards now also lead directly to a unified login or can pre-set the role if needed, 
// but user requested to skip selection)
roleCards.forEach(card => {
    card.addEventListener("click", () => {
        loginError.textContent = "";
        loginTitle.textContent = "Portal Login";
        showSection("loginSection");
    });
});

// -------------------- LOGIN NAV BUTTON --------------------
loginNavBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    loginError.textContent = "";
    loginTitle.textContent = "Portal Login";
    showSection("loginSection"); // Or showUnifiedLogin() if you refactor
});

// -------------------- BACK BUTTON --------------------
backBtn.addEventListener("click", () => {
    selectedRole = null;
    loginError.textContent = "";
    showSection("roleSelection");
});

// -------------------- UNIFIED LOGIN LOGIC --------------------
loginBtn.addEventListener("click", async () => {
    loginError.textContent = "";
    loginError.style.color = "red";

    const collegeId = document.getElementById("collegeSelect").value;
    if (!collegeId) {
        loginError.textContent = "Please select your college!";
        return;
    }

    const identifier = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!identifier || !password) {
        loginError.textContent = "Please fill all fields!";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Authenticating...";

    // Determine the order to try based on input patterns
    const rolesToTry = [];
    if (identifier.includes("@")) {
        rolesToTry.push("faculty", "admin", "student");
    } else if (/\d/.test(identifier) && identifier.length > 5) {
        // Most likely a student roll number if it has numbers and is long enough
        rolesToTry.push("student", "faculty", "admin");
    } else {
        rolesToTry.push("admin", "faculty", "student");
    }

    let success = false;

    for (const role of rolesToTry) {
        let url = "";
        let payload = {};

        if (role === "student") {
            url = "/student/validate";
            payload = { studentRollNumber: identifier, password: password, collegeId: collegeId };
        } else if (role === "faculty") {
            url = "/faculty/validate";
            payload = { email: identifier, password: password, collegeId: collegeId };
        } else if (role === "admin") {
            url = "/admin/validate";
            payload = { username: identifier, password: password, collegeId: collegeId };
        }

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const responseData = await res.json();

                selectedRole = role; // Set the global selectedRole
                sessionStorage.setItem("token", responseData.token);
                delete responseData.token;

                loggedInUser = responseData;
                sessionStorage.setItem("user", JSON.stringify(loggedInUser));
                sessionStorage.setItem("role", selectedRole);

                loginError.style.color = "green";
                loginError.textContent = "Login Successful!";

                if (selectedRole === "student" && typeof window.setStudentRoll === "function") {
                    window.setStudentRoll(loggedInUser.rollNumber);
                }

                setTimeout(() => {
                    showDashboard();
                }, 500);

                success = true;
                break; // Stop trying other roles
            } else {
                const errorText = await res.text();
                // If the error is specifically about account deactivation, stop and show that message
                if (errorText.toLowerCase().includes("deactivated")) {
                    loginError.textContent = errorText;
                    success = false;
                    break;
                }
                // Otherwise, continue to the next role in rolesToTry
                loginError.textContent = "Invalid credentials. Please try again.";
            }
        } catch (err) {
            console.error(`Error trying ${role} login:`, err);
        }
    }

    if (!success) {
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
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
    // Hide public navigation links when logged in to prevent navigation issues
    if (publicNavLinks) publicNavLinks.classList.add("hidden");

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
                <button class="menu-btn" onclick="openSettingsModal()">
                    <span>⚙️</span> Settings
                </button>
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
                <button class="menu-btn" onclick="openSettingsModal()">
                    <span>⚙️</span> Settings
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
                <button class="menu-btn" onclick="openSettingsModal()">
                    <span>⚙️</span> Settings
                </button>
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
    const publicNavLinks = document.getElementById("publicNavLinks");

    if (profileMenu) profileMenu.classList.add("hidden");
    if (profileDropdown) profileDropdown.classList.remove("show");

    // Show public navigation links again after logout
    if (publicNavLinks) publicNavLinks.classList.remove("hidden");

    // Reset Header Name
    const headerUserName = document.getElementById("headerUserName");
    if (headerUserName) headerUserName.textContent = "Profile";

    showSection("landingSection");
}

// -------------------- NAVBAR NAVIGATION --------------------
loginNavBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    loginTitle.textContent = "Portal Login";
    showSection("loginSection");
});

homeNavBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    showSection("landingSection");
});

homeLogo?.addEventListener("click", () => {
    showSection("landingSection");
});

// Scroll to sections within landing page if clicked from within dashboard or role selection
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
            // If we are not in the landing section, show it first
            if (!landingSection.classList.contains('active-section')) {
                showSection("landingSection");
                // Allow a tiny delay for section to show before browser scrolls
                setTimeout(() => {
                    const target = document.querySelector(href);
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                }, 50);
            }
        }
    });
});

// -------------------- MOBILE HAMBURGER MENU --------------------
const hamburger = document.querySelector(".hamburger-menu");
const navLinks = document.getElementById("publicNavLinks");

hamburger?.addEventListener("click", () => {
    navLinks?.classList.toggle("active");
});

// Close menu when clicking a link
document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', () => {
        navLinks?.classList.remove("active");
    });
});

// -------------------- INIT --------------------
async function loadColleges() {
    const select = document.getElementById("collegeSelect");
    if (!select) return;
    try {
        const res = await fetch("/auth/colleges");
        if (res.ok) {
            const colleges = await res.json();
            // Keep the default option
            select.innerHTML = '<option value="" disabled selected>Select Your College</option>';
            colleges.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = c.collegeName;
                select.appendChild(opt);
            });
        }
    } catch (err) {
        console.error("Failed to load colleges", err);
    }
}

async function submitPublicContact(e) {
    e.preventDefault();
    const btn = document.getElementById("contactSubmitBtn");
    const status = document.getElementById("contactFormStatus");
    const formData = {
        name: document.getElementById("contactName").value,
        email: document.getElementById("contactEmail").value,
        phone: document.getElementById("contactPhone").value,
        subject: document.getElementById("contactSubject").value,
        message: document.getElementById("contactMessage").value
    };

    btn.disabled = true;
    btn.textContent = "Sending...";
    status.style.display = "block";
    status.style.color = "#5c6bc0";
    status.textContent = "Please wait...";

    try {
        const res = await fetch("/api/superadmin/public/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            status.style.color = "#10b981";
            status.textContent = "Message sent successfully! We'll get back to you soon. ✅";
            document.getElementById("landingContactForm").reset();
        } else {
            throw new Error("Failed to send message.");
        }
    } catch (err) {
        status.style.color = "#ef4444";
        status.textContent = "Error sending message. Please try again later. ❌";
    } finally {
        btn.disabled = false;
        btn.textContent = "Send Message 🚀";
    }
}

// -------------------- DYNAMIC LANDING CONTENT --------------------
async function loadLandingContent() {
    try {
        const infoRes = await fetch("/api/superadmin/public/portal-info");
        if (infoRes.ok) {
            const info = await infoRes.json();
            if (info) {
                // 1. Hero
                if (info.heroTitle) document.getElementById("heroTitle").textContent = info.heroTitle;
                if (info.heroTagline) document.getElementById("heroTagline").textContent = info.heroTagline;

                // 2. About
                if (info.aboutTitle) document.getElementById("aboutTitle").textContent = info.aboutTitle;
                if (info.aboutDescription) document.getElementById("aboutAboutDesc").textContent = info.aboutDescription;

                if (info.aboutStory) {
                    const storyContainer = document.getElementById("aboutStoryContainer");
                    document.getElementById("aboutStory").textContent = info.aboutStory;
                    storyContainer.classList.remove("hidden");
                } else {
                    document.getElementById("aboutStoryContainer").classList.add("hidden");
                }

                // Vision & Mission
                if (info.vision) document.getElementById("visionText").textContent = info.vision;
                if (info.mission) document.getElementById("missionText").textContent = info.mission;

                // Contact
                if (info.contactEmail) document.getElementById("landingDisplayEmail").textContent = info.contactEmail;
                if (info.contactPhone) document.getElementById("landingDisplayPhone").textContent = info.contactPhone;

                // 3. What We Offer (JSON)
                const offerGrid = document.getElementById("offerGrid");
                if (offerGrid) {
                    let offers = [];
                    try { offers = JSON.parse(info.whatWeOffer || "[]"); } catch (e) { }

                    // Fallback Default if empty
                    if (offers.length === 0) {
                        offers = [
                            { title: "MCQ Examinations", image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&q=80&w=400" },
                            { title: "Programming Tests", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400" },
                            { title: "Skill Assessments", image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400" },
                            { title: "Instant Evaluation", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400" },
                            { title: "Secure Online Exams", image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400" },
                            { title: "Performance Analytics", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400" }
                        ];
                    }

                    offerGrid.innerHTML = offers.map(o => `
                        <div class="offer-card">
                            <div class="offer-img" style="background-image: url('${o.image || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400'}');"></div>
                            <div style="padding: 20px; text-align: center;">
                                <h4 style="margin: 0; color: #1e293b; font-size: 1.25rem;">${o.title}</h4>
                            </div>
                        </div>
                    `).join("");
                }

                // 4. Why Choose (JSON)
                const whyChooseGrid = document.getElementById("whyChooseGrid");
                if (whyChooseGrid) {
                    let reasons = [];
                    try { reasons = JSON.parse(info.whyChoose || "[]"); } catch (e) { }

                    if (reasons.length === 0) {
                        reasons = [
                            "Industry-standard exam pattern",
                            "Auto-evaluation",
                            "Real-time results",
                            "User-friendly interface",
                            "Trusted by students & institutions"
                        ];
                    }

                    // Handle both string array and object array
                    whyChooseGrid.innerHTML = reasons.map(r => {
                        const txt = typeof r === 'string' ? r : r.title;
                        const icon = typeof r === 'object' && r.icon ? r.icon : "✅";
                        return `
                        <div class="about-card" style="padding: 20px; display: flex; align-items: center; gap: 15px;">
                            <div style="color: var(--landing-primary); font-size: 1.2rem;">${icon}</div>
                            <h4 style="margin: 0; color: #475569; font-size: 1rem;">${txt}</h4>
                        </div>
                    `}).join("");
                }

                // 5. Features (JSON - Nested Categories)
                const featuresContainer = document.getElementById("featuresContainer");
                if (featuresContainer) {
                    let features = {};
                    try { features = JSON.parse(info.features || "{}"); } catch (e) { }

                    if (Object.keys(features).length === 0) {
                        features = {
                            "Examination Features": {
                                items: ["Timed MCQ exams", "Coding tests with real test cases", "Auto submission on timeout", "Randomized questions"],
                                image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800"
                            },
                            "Evaluation Features": {
                                items: ["Instant result generation", "Detailed score analysis", "Accuracy & time tracking", "Performance reports"],
                                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
                            },
                            "Security Features": {
                                items: ["Anti-cheating mechanisms", "Tab-switch monitoring", "Random question shuffling", "Secure login system"],
                                image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800"
                            }
                        };
                    }

                    // Render Features
                    featuresContainer.innerHTML = Object.keys(features).map((cat, index) => {
                        const data = Array.isArray(features[cat]) ? { items: features[cat], image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800" } : features[cat];
                        const isEven = index % 2 === 0;

                        return `
                        <div class="feature-category" style="display: grid; grid-template-columns: ${isEven ? '1fr 1fr' : '1fr 1fr'}; gap: 40px; align-items: center; margin-bottom: 60px; padding: 40px; background: var(--card-bg); border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                            ${!isEven ? `<div style="height: 300px; background: url('${data.image}') center/cover no-repeat; border-radius: 20px; box-shadow: 0 15px 30px rgba(0,0,0,0.1);"></div>` : ''}
                            
                            <div>
                                <h3 style="color: var(--primary); margin-bottom: 20px; font-size: 2rem; font-weight: 800;">${cat}</h3>
                                <div style="display: grid; gap: 15px;">
                                    ${data.items.map(f => `
                                        <div style="display: flex; align-items: center; gap: 15px; font-size: 1.1rem; color: var(--text-muted);">
                                            <span style="width: 24px; height: 24px; background: var(--bg-color); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; border:1px solid var(--border);">✓</span>
                                            ${f}
                                        </div>
                                    `).join("")}
                                </div>
                            </div>
                            
                            ${isEven ? `<div style="height: 300px; background: url('${data.image}') center/cover no-repeat; border-radius: 20px; box-shadow: 0 15px 30px rgba(0,0,0,0.1);"></div>` : ''}
                        </div>
                    `}).join("");
                }

                // 6. How It Works (JSON) & Exam Types
                const howItWorksContainer = document.getElementById("howItWorksSteps");
                if (howItWorksContainer) {
                    let steps = [];
                    try { steps = JSON.parse(info.howItWorks || "[]"); } catch (e) { }

                    if (steps.length === 0) {
                        steps = ["Register / Login", "Choose Exam", "Attempt MCQs / Coding Test", "Submit Exam", "View Results & Analysis"];
                    }

                    howItWorksContainer.innerHTML = steps.map((s, idx) => `
                        <div style="position: relative; background: var(--card-bg); padding: 20px 30px; border-radius: 50px; border: 2px solid var(--border); color: var(--primary); font-weight: 700;">
                            <span style="width: 30px; height: 30px; background: var(--primary); color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px;">${idx + 1}</span>
                            ${s}
                        </div>
                    `).join("");
                }

                // Exam Types
                const examTypesGrid = document.getElementById("examTypesGrid");
                if (examTypesGrid) {
                    let types = [];
                    try { types = JSON.parse(info.examTypes || "[]"); } catch (e) { }

                    if (types.length === 0) {
                        types = ["Practice Tests", "Mock Exams", "Final Assessments"];
                    }

                    examTypesGrid.innerHTML = types.map(t => `
                        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 15px 30px; border-radius: 15px; font-weight: 600; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);">
                            ${t}
                        </div>
                    `).join("");
                }

                // What We Do (About Tag List) - Assuming stored in Features or separate? 
                // The prompt had "What We Do" in About Page. I'll hardcode or deduce.
                // Let's deduce from Features or use a hardcoded fallback if not found.
                // Or just use the defaults requested: "Conduct online MCQ exams", "Host coding challenges"...
                const whatWeDoList = document.getElementById("whatWeDoList");
                if (whatWeDoList) {
                    // This wasn't explicitly a field in PortalInfo I added, but I can add it or just hardcode for now
                    // since I didn't add a specific field for this small list.
                    // I'll leave it hardcoded or use the "Features" logic if applicable.
                    // Actually, I'll just hardcode the defaults requested as they are quite specific.
                    const todos = ["Conduct online MCQ exams", "Host coding challenges", "Provide instant results", "Offer detailed performance analytics"];
                    whatWeDoList.innerHTML = todos.map(t => `
                        <span style="background: #eff6ff; color: #3b82f6; padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: 600;">✨ ${t}</span>
                   `).join("");
                }

            }
        }
    } catch (e) {
        console.error("Error loading landing content", e);
    }
}

// Theme Init
(function () {
    try {
        if (localStorage.getItem("theme") === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        }
    } catch (e) { }
})();

// Global Settings Logic
function toggleTheme(isDark) {
    if (isDark) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
    }
}

function openSettingsModal() {
    const isDark = localStorage.getItem("theme") === "dark";
    const modalHtml = `
        <div style="padding: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 15px 0; border-bottom: 1px solid var(--border);">
                <div>
                   <h4 style="margin:0; font-size:1.05rem; color:var(--text-main);">Dark Mode</h4>
                   <p style="margin:5px 0 0; font-size:0.85rem; color:var(--text-muted);">Switch between light and dark themes.</p>
                </div>
                <label class="switch" style="position:relative; display:inline-block; width:50px; height:28px;">
                  <input type="checkbox" ${isDark ? 'checked' : ''} onchange="toggleTheme(this.checked)">
                  <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#cbd5e1; transition:.4s; border-radius:34px;"></span>
                  <style>
                    .switch input:checked + .slider { background-color: #60a5fa; }
                    .switch input:checked + .slider:before { transform: translateX(20px); }
                    .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                  </style>
                </label>
            </div>
        </div>
    `;

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
        <div class="modal-content animate-up" style="max-width:450px; border-radius:20px;">
             <div class="modal-header" style="border-bottom:1px solid var(--border);">
                <h3 style="color:var(--text-main);">Settings</h3>
                <span class="modal-close-x" onclick="this.closest('.modal-overlay').remove()">&times;</span>
             </div>
             ${modalHtml}
             <div class="modal-footer" style="padding: 15px; border-top: 1px solid var(--border); text-align: right;">
                <button class="menu-btn" onclick="this.closest('.modal-overlay').remove()" style="width: auto; padding: 8px 20px; background: var(--bg-color); color: var(--text-main); font-weight:600;">Close</button>
             </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

document.addEventListener("DOMContentLoaded", () => {
    loadLandingContent();
    loadColleges();
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
        showSection("landingSection");
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

// -------------------- FORGOT PASSWORD LOGIC --------------------
document.getElementById("forgotPasswordBtn")?.addEventListener("click", () => {
    const identifier = document.getElementById("loginIdentifier").value.trim();

    // If they've already typed an email, it's likely faculty
    if (identifier.includes("@")) {
        // Trigger Faculty Forgot Password
        document.getElementById("facultyForgotPasswordBtn")?.click();
        // -------------------- COURSE DETAILS MODAL --------------------
        window.showCourseDetails = function (courseIndex) {
            const modal = document.getElementById("landingCourseModal");
            // Since we set display:none in HTML, we must force flex here
            modal.style.display = "flex";
            modal.classList.remove("hidden");

            // Logic to populate data would go here if we had the course array
            // For now, static or previously loaded data
        }
        // Note: The above might fail if the element is removed. 
        // Let's use the actual window functions if they exist.
        if (window.showFacultyForgotPassword) {
            window.showFacultyForgotPassword();
        } else {
            alert("Please contact faculty administration or enter your email to proceed.");
        }
    } else {
        // Default to student forgot password for roll numbers
        if (window.showStudentForgotPassword) {
            window.showStudentForgotPassword();
        } else {
            alert("Please contact your administrator.");
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




