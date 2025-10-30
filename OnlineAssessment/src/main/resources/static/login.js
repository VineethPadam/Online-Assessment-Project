const roleCards = document.querySelectorAll(".role-card[data-role]");
const roleSelection = document.getElementById("roleSelection");
const loginSection = document.getElementById("loginSection");
const loginTitle = document.getElementById("loginTitle");
const studentFields = document.getElementById("studentFields");
const facultyFields = document.getElementById("facultyFields");
const adminFields = document.getElementById("adminFields");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const backBtn = document.getElementById("backBtn");

const dashboard = document.getElementById("dashboard");
const welcomeMsg = document.getElementById("welcomeMsg");
const studentDashboard = document.getElementById("studentDashboard");
const facultyDashboard = document.getElementById("facultyDashboard");
const adminDashboard = document.getElementById("adminDashboard");

let selectedRole = null;
let loggedInUser = null;

// -------------------- ROLE CARD SELECTION --------------------
roleCards.forEach(card => {
    card.addEventListener("click", () => {
        selectedRole = card.dataset.role;

        loginSection.classList.add("show");
        loginError.textContent = "";
        backBtn.style.display = "block";

        studentFields.style.display = "none";
        facultyFields.style.display = "none";
        adminFields.style.display = "none";

        if(selectedRole === "student") studentFields.style.display = "block";
        if(selectedRole === "faculty") facultyFields.style.display = "block";
        if(selectedRole === "admin") adminFields.style.display = "block";

        loginTitle.textContent = `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login`;

        // 👇 Add this line to scroll smoothly to the login box
        setTimeout(() => {
            loginSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    });
});

// -------------------- BACK BUTTON --------------------
backBtn.addEventListener("click", () => {
    loginSection.classList.remove("show");
    selectedRole = null;
    loginError.textContent = "";
    studentFields.querySelectorAll("input").forEach(i => i.value = "");
    facultyFields.querySelectorAll("input").forEach(i => i.value = "");
    adminFields.querySelectorAll("input").forEach(i => i.value = "");
});

// -------------------- LOGIN --------------------
loginBtn.addEventListener("click", async () => {
    loginError.textContent = "";
    let url = "";
    let payload = {};

    if(selectedRole === "student") {
        const roll = document.getElementById("studentRoll").value.trim();
        const pass = document.getElementById("studentPassword").value.trim();
        if(!roll || !pass) { loginError.textContent = "Please fill all fields!"; return; }
        payload = { studentRollNumber: roll, password: pass };
        url = "/student/validate";

    } else if(selectedRole === "faculty") {
        const email = document.getElementById("facultyEmail").value.trim();
        const pass = document.getElementById("facultyPassword").value.trim(); // updated
        if(!email || !pass) { loginError.textContent = "Please fill all fields!"; return; }
        payload = { email: email, password: pass }; // updated payload
        url = "/faculty/validate";

    } else if(selectedRole === "admin") {
        const username = document.getElementById("adminUsername").value.trim();
        const password = document.getElementById("adminPassword").value.trim();
        if(!username || !password) { loginError.textContent = "Please fill all fields!"; return; }
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

        if(res.ok){
            loggedInUser = await res.json();
            loginError.style.color = "green";
            loginError.textContent = "Login Successful!";
			
			localStorage.setItem("role", selectedRole);
			localStorage.setItem("user", JSON.stringify(loggedInUser));


            // -------------------- SET STUDENT ROLL FOR STUDENT.JS --------------------
            if(selectedRole === "student") {
                window.setStudentRoll(loggedInUser.studentRollNumber);
            }

            setTimeout(() => {
                loginSection.classList.remove("show");
                loginError.textContent = "";
                roleSelection.style.display = "none"; // hide roles
                showDashboard();
            }, 500);

        } else {
            loginError.style.color = "red";
            loginError.textContent = await res.text();
        }
    } catch(err) {
        loginError.style.color = "red";
        loginError.textContent = "Server error: " + err.message;
    }
});

// -------------------- SHOW DASHBOARD --------------------
function showDashboard(){
    dashboard.classList.remove("hidden");
    welcomeMsg.textContent = `Welcome ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`;

    studentDashboard.classList.add("hidden");
    facultyDashboard.classList.add("hidden");
    adminDashboard.classList.add("hidden");

    if(selectedRole === "student") studentDashboard.classList.remove("hidden");
    if(selectedRole === "faculty") facultyDashboard.classList.remove("hidden");
    if(selectedRole === "admin") adminDashboard.classList.remove("hidden");

    // Logout handlers
    document.getElementById("studentLogout")?.addEventListener("click", logout);
    document.getElementById("facultyLogout")?.addEventListener("click", logout);
    document.getElementById("adminLogout")?.addEventListener("click", logout);
}

// -------------------- LOGOUT --------------------
function logout(){
    loggedInUser = null;
    selectedRole = null;
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    dashboard.classList.add("hidden");
    roleSelection.style.display = "block"; // show roles again
}
window.addEventListener("load", () => {
    const savedRole = localStorage.getItem("role");
    const savedUser = localStorage.getItem("user");

    if(savedRole && savedUser) {
        selectedRole = savedRole;
        loggedInUser = JSON.parse(savedUser);

        // If it's student, reapply roll number
        if(selectedRole === "student" && loggedInUser.studentRollNumber) {
            window.setStudentRoll(loggedInUser.studentRollNumber);
        }

        roleSelection.style.display = "none";
        showDashboard();
    }
});

