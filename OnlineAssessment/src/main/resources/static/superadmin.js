// Super Admin Extended Logic with Secure Login and Advanced Question Editor

// --- Auth Check ---
const token = sessionStorage.getItem("token");
// Simple role check decode
function getRole(token) {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role; // Assuming token has 'role'
    } catch (e) { return null; }
}

const role = getRole(token);

// --- Modal Alert System ---
function showModalAlert(message, title = "Security Alert", icon = "⚠️") {
    document.getElementById("alertTitle").innerText = title;
    document.getElementById("alertMessage").innerText = message;
    document.getElementById("alertIcon").innerText = icon;
    document.getElementById("alertOverlay").style.display = "flex";
}

window.closeAlert = () => {
    document.getElementById("alertOverlay").style.display = "none";
};

function showModalConfirm(message, title = "Confirmation Required") {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(5px); z-index:3000; display:flex; align-items:center; justify-content:center; padding:20px;";
        overlay.innerHTML = `
            <div style="background:white; width:90%; max-width:400px; padding:30px; border-radius:24px; box-shadow:0 30px 60px rgba(0,0,0,0.3); text-align:center; border: 1px solid #fbcfe8;">
                <h2 style="margin:0; font-weight:900; color:#831843;">${title}</h2>
                <p style="margin: 15px 0 25px; font-weight:600; color:#be185d; line-height:1.5;">${message}</p>
                <div style="display:flex; gap:10px;">
                    <button id="confCancel" class="sa-btn" style="background:#f1f5f9; color:#64748b; flex:1;">Cancel</button>
                    <button id="confOk" class="sa-btn" style="flex:1;">Proceed</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector("#confCancel").onclick = () => {
            document.body.removeChild(overlay);
            resolve(false);
        };
        overlay.querySelector("#confOk").onclick = () => {
            document.body.removeChild(overlay);
            resolve(true);
        };
    });
}

// If not superadmin, show Login Modal instantly and block everything
if (!token || role !== 'SUPERADMIN') {
    document.body.innerHTML = ""; // Clear body
    document.body.style.background = "#fdf2f8";
    const loginDiv = document.createElement("div");
    loginDiv.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height:100vh;">
            <div style="background:white; padding:40px; border-radius:24px; box-shadow:0 20px 40px rgba(0,0,0,0.1); width:400px; text-align:center;">
                <div style="width:60px; height:60px; background:#ec4899; border-radius:12px; margin:0 auto 20px;"></div>
                <h1 style="color:#831843; font-weight:900; margin-bottom:10px;">Super Admin</h1>
                <p style="color:#be185d; margin-bottom:30px;">Secure Gateway</p>
                <input id="saUser" placeholder="Username" style="width:100%; padding:15px; border-radius:12px; border:2px solid #fce7f3; margin-bottom:15px; outline:none; font-weight:600;">
                <input id="saPass" type="password" placeholder="Password" style="width:100%; padding:15px; border-radius:12px; border:2px solid #fce7f3; margin-bottom:25px; outline:none; font-weight:600;">
                <button id="saLoginBtn" style="width:100%; padding:15px; border-radius:12px; background:#ec4899; color:white; font-weight:800; border:none; cursor:pointer; font-size:16px;">Access Dashboard</button>
                <div id="saErr" style="color:red; margin-top:20px; font-size:14px; font-weight:600;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(loginDiv);

    document.getElementById("saLoginBtn").onclick = async () => {
        const u = document.getElementById("saUser").value;
        const p = document.getElementById("saPass").value;
        const btn = document.getElementById("saLoginBtn");

        btn.textContent = "Verifying...";
        try {
            const res = await fetch("/auth/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: u, password: p })
            });
            if (res.ok) {
                const data = await res.json();
                sessionStorage.setItem("token", data.token); // Store token
                location.reload();
            } else {
                throw new Error();
            }
        } catch (e) {
            document.getElementById("saErr").textContent = "Access Denied. Invalid Credentials.";
            btn.textContent = "Access Dashboard";
        }
    };
    throw new Error("Halt execution"); // Stop rest of script
}

// --- Authorized Logic Below ---

// --- Tabs ---
document.querySelectorAll(".sa-tab").forEach(t => {
    t.addEventListener("click", () => {
        document.querySelectorAll(".sa-tab").forEach(x => x.classList.remove("active"));
        t.classList.add("active");

        document.getElementById("tab-colleges").style.display = "none";
        document.getElementById("tab-bank").style.display = "none";
        document.getElementById("tab-content").style.display = "none";

        document.getElementById("tab-" + t.dataset.tab).style.display = "block";

        if (t.dataset.tab === 'content') {
            loadSAProfile();
        }
    });
});

// --- Modal Helper ---
function showModal(title, contentHtml, buttonsHtml = "") {
    const ov = document.getElementById("modalOverlay");
    const ct = document.getElementById("modalContent");
    ov.style.display = "flex";
    ct.style.maxWidth = "700px"; // Default
    if (contentHtml.length > 1000) ct.style.maxWidth = "1100px"; // Wide for big forms

    ct.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #fce7f3; padding-bottom:15px;">
            <h2 style="margin:0; color:var(--admin-text); font-weight:900; font-size:24px;">${title}</h2>
            <button onclick="document.getElementById('modalOverlay').style.display='none'" style="background:none; border:none; font-size:24px; color:#be185d; cursor:pointer;">&times;</button>
        </div>
        <div style="margin:20px 0;">${contentHtml}</div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px; border-top:1px solid #fce7f3; padding-top:20px;">
            ${buttonsHtml}
        </div>
    `;
}

// =======================
// 1. COLLEGES (Simplified for brevity, focus is Questions)
// =======================
function loadColleges() {
    const grid = document.getElementById("collegesGrid");
    authFetch("/api/superadmin/colleges").then(r => r.json()).then(data => {
        if (data.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#be185d; font-weight:600;">No colleges found. Add one to get started.</div>`;
            return;
        }
        grid.innerHTML = data.map(c => {
            // Build permission badges
            const questionTypes = [];
            if (c.allowMcqQuestions !== false) questionTypes.push('MCQ');
            if (c.allowCodingQuestions !== false) questionTypes.push('Coding');
            if (c.allowNumericQuestions !== false) questionTypes.push('Numeric');

            const features = [];
            if (c.allowImageInQuestions !== false) features.push('Images');
            if (c.allowQuestionBankAccess !== false) features.push('Q-Bank');

            return `
            <div class="college-card" style="cursor:pointer; opacity: ${c.active ? '1' : '0.6'};" onclick="openEditCollegeModal(${c.id})">
                 <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="font-size:10px; font-weight:800; color:${c.active ? '#15803d' : '#be185d'}; text-transform:uppercase; background:${c.active ? '#dcfce7' : '#fee2e2'}; padding:4px 10px; border-radius:6px; border:1px solid ${c.active ? '#bbf7d0' : '#fecaca'};">
                        ${c.active ? '● Active' : '○ Deactivated'}
                    </span>
                    <div style="display:flex; gap:10px;">
                        <button class="sa-mini-btn" style="color:#0ea5e9;" onclick="event.stopPropagation(); openEditCollegeModal(${c.id})">Edit</button>
                        <button class="sa-mini-btn" style="color:${c.active ? '#be185d' : '#15803d'};" onclick="event.stopPropagation(); toggleCollegeStatus(${c.id}, ${c.active})">
                            ${c.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="sa-mini-btn" style="color:#ef4444;" onclick="event.stopPropagation(); deleteCollege(${c.id})">Delete</button>
                    </div>
                </div>
                <h3 style="margin:0 0 5px; color:#1e293b; font-size:18px; font-weight:800;">${c.collegeName}</h3>
                <div style="font-family:monospace; font-size:14px; color:#64748b; background:#f8fafc; padding:8px; border-radius:8px; margin:10px 0; border:1px solid #e2e8f0;">
                    CODE: <strong>${c.accessCode}</strong>
                </div>
                <p style="margin:5px 0 10px; color:#475569; font-size:12px; font-weight:600;">${c.contactEmail || 'No email'}</p>
                
                <!-- Permission Badges -->
                <div style="margin-top:12px; padding-top:12px; border-top:1px solid #e2e8f0;">
                    <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px;">
                        ${questionTypes.map(qt => `<span style="font-size:9px; font-weight:700; color:#0369a1; background:#e0f2fe; padding:3px 8px; border-radius:4px; border:1px solid #bae6fd;">${qt}</span>`).join('')}
                        ${questionTypes.length === 0 ? '<span style="font-size:9px; color:#94a3b8;">No question types</span>' : ''}
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:8px;">
                        ${features.map(f => `<span style="font-size:9px; font-weight:700; color:#92400e; background:#fef3c7; padding:3px 8px; border-radius:4px; border:1px solid #fde68a;">${f}</span>`).join('')}
                    </div>
                    <div style="font-size:10px; color:#059669; font-weight:600; background:#f0fdf4; padding:6px 8px; border-radius:6px; border:1px solid #bbf7d0;">
                        👥 ${c.maxFacultyUsers || 50} Faculty | ${c.maxStudentUsers || 1000} Students | ${c.maxTotalUsers || 1050} Total
                    </div>
                </div>
            </div>
        `;
        }).join("");
    });
}

window.toggleCollegeStatus = async (id, currentStatus) => {
    const action = currentStatus ? "Deactivate" : "Activate";
    const confirmed = await showModalConfirm(`Are you sure you want to ${action} this college? Members will not be able to login if deactivated.`);
    if (!confirmed) return;

    try {
        const res = await authFetch(`/api/superadmin/colleges/${id}/toggle-status`, { method: "PUT" });
        if (res.ok) {
            loadColleges();
            showModalAlert(`College ${action}d Successfully!`, "Success", "✅");
        } else {
            showModalAlert("Failed to toggle status: " + await res.text());
        }
    } catch (e) {
        showModalAlert("Error: " + e.message);
    }
}
function openAddCollegeModal() {
    const html = `
        <div style="display:grid; gap:15px;">
            <div>
                <label class="input-label">College Name *</label>
                <input id="newColName" class="sa-input" placeholder="e.g. IIT Madras">
            </div>
            <div>
                <label class="input-label">Access Code (Auto-generated if empty)</label>
                <input id="newColCode" class="sa-input" placeholder="Unique Subscription Code">
            </div>
            <div class="grid-2">
                <div>
                    <label class="input-label">Admin Email *</label>
                    <input id="newColEmail" class="sa-input" placeholder="admin@college.edu">
                </div>
                <div>
                    <label class="input-label">Contact Phone</label>
                    <input id="newColPhone" class="sa-input" placeholder="+91...">
                </div>
            </div>
            <div class="grid-2" style="background:#fdf2f8; padding:15px; border-radius:12px; border:1px solid #fbcfe8;">
                <div>
                    <label class="input-label" style="color:#be185d;">Admin Username *</label>
                    <input id="newColAdminUser" class="sa-input" placeholder="e.g. admin_bits">
                </div>
                <div>
                    <label class="input-label" style="color:#be185d;">Admin Password *</label>
                    <input id="newColAdminPass" type="password" class="sa-input" placeholder="Secure Password">
                </div>
            </div>
            <div>
                <label class="input-label">Location / Address</label>
                <input id="newColAddr" class="sa-input" placeholder="City, State">
            </div>

            <!-- Permission System -->
            <div style="background:#f0f9ff; padding:20px; border-radius:12px; border:2px solid #0ea5e9; margin-top:10px;">
                <h3 style="margin:0 0 15px; color:#0369a1; font-size:16px; font-weight:900;">📋 Question Type Permissions</h3>
                <div style="display:grid; gap:12px;">
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px; background:white; border-radius:8px; border:1px solid #bae6fd;">
                        <input type="checkbox" id="newAllowMcq" checked style="width:18px; height:18px; cursor:pointer;">
                        <span style="font-weight:700; color:#0c4a6e;">Allow MCQ Questions</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px; background:white; border-radius:8px; border:1px solid #bae6fd;">
                        <input type="checkbox" id="newAllowCoding" checked style="width:18px; height:18px; cursor:pointer;">
                        <span style="font-weight:700; color:#0c4a6e;">Allow Coding Questions</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px; background:white; border-radius:8px; border:1px solid #bae6fd;">
                        <input type="checkbox" id="newAllowNumeric" checked style="width:18px; height:18px; cursor:pointer;">
                        <span style="font-weight:700; color:#0c4a6e;">Allow Numeric Questions</span>
                    </label>
                </div>
            </div>

            <div style="background:#fef3c7; padding:20px; border-radius:12px; border:2px solid #f59e0b; margin-top:10px;">
                <h3 style="margin:0 0 15px; color:#92400e; font-size:16px; font-weight:900;">⚙️ Feature Permissions</h3>
                <div style="display:grid; gap:12px;">
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px; background:white; border-radius:8px; border:1px solid #fde68a;">
                        <input type="checkbox" id="newAllowImages" checked style="width:18px; height:18px; cursor:pointer;">
                        <span style="font-weight:700; color:#78350f;">Allow Image Handling in Questions</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px; background:white; border-radius:8px; border:1px solid #fde68a;">
                        <input type="checkbox" id="newAllowQuestionBank" checked style="width:18px; height:18px; cursor:pointer;">
                        <span style="font-weight:700; color:#78350f;">Allow Question Bank Access</span>
                    </label>
                </div>
            </div>

            <div style="background:#f0fdf4; padding:20px; border-radius:12px; border:2px solid #10b981; margin-top:10px;">
                <h3 style="margin:0 0 15px; color:#065f46; font-size:16px; font-weight:900;">👥 User Limits</h3>
                <div class="grid-3">
                    <div>
                        <label class="input-label" style="color:#065f46;">Max Faculty</label>
                        <input type="number" id="newMaxFaculty" class="sa-input" value="50" min="1" placeholder="50">
                    </div>
                    <div>
                        <label class="input-label" style="color:#065f46;">Max Students</label>
                        <input type="number" id="newMaxStudents" class="sa-input" value="1000" min="1" placeholder="1000">
                    </div>
                    <div>
                        <label class="input-label" style="color:#065f46;">Max Total Users</label>
                        <input type="number" id="newMaxTotal" class="sa-input" value="1050" min="1" placeholder="1050">
                    </div>
                </div>
                <p style="font-size:11px; color:#059669; margin:10px 0 0; font-weight:600;">Total includes Faculty + Students + Admins</p>
            </div>
        </div>
    `;
    const btns = `
        <button class="sa-btn" style="background:#fce7f3; color:#831843;" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
        <button class="sa-btn" id="regColBtn" onclick="submitNewCollege()">Register College</button>
    `;
    showModal("Register New College", html, btns);
}

window.openEditCollegeModal = async (id) => {
    try {
        const res = await authFetch(`/api/superadmin/colleges/${id}`);
        if (!res.ok) throw new Error("Could not fetch college details");
        const c = await res.json();

        const html = `
            <div style="display:grid; gap:15px;">
                <div>
                    <label class="input-label">College Name *</label>
                    <input id="editColName" class="sa-input" value="${c.collegeName}">
                </div>
                <div class="grid-2">
                    <div>
                        <label class="input-label">Admin Email *</label>
                        <input id="editColEmail" class="sa-input" value="${c.contactEmail || ''}">
                    </div>
                    <div>
                        <label class="input-label">Contact Phone</label>
                        <input id="editColPhone" class="sa-input" value="${c.contactPhone || ''}">
                    </div>
                </div>
                <div class="grid-2" style="background:#f1f5f9; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">
                    <div>
                        <label class="input-label" style="color:#64748b;">Admin Username</label>
                        <input id="editColAdminUser" class="sa-input" value="${c.adminUsername || ''}" readonly style="background:#f8fafc; color:#94a3b8;">
                        <small style="color:#94a3b8; font-size:10px;">Username cannot be changed</small>
                    </div>
                    <div>
                        <label class="input-label" style="color:#64748b;">Admin Password</label>
                        <input id="editColAdminPass" type="text" class="sa-input" value="${c.adminPassword || ''}" style="background:#f8fafc; color:#64748b;">
                        <small style="color:#94a3b8; font-size:10px;">Reference only</small>
                    </div>
                </div>
                <div>
                    <label class="input-label">Location / Address</label>
                    <input id="editColAddr" class="sa-input" value="${c.address || ''}">
                </div>
                <div style="background:#fefce8; padding:10px; border-radius:10px; border:1px solid #fef08a;">
                     <p style="margin:0; font-size:12px; color:#a16207; font-weight:600;">License Code: ${c.accessCode}</p>
                </div>

                <!-- Permission System -->
                <div style="background:#f0f9ff; padding:20px; border-radius:12px; border:2px solid #0ea5e9; margin-top:10px;">
                    <h3 style="margin:0 0 15px; color:#0369a1; font-size:16px; font-weight:900;">📋 Question Type Permissions</h3>
                    <div style="display:grid; gap:12px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px; background:white; border-radius:8px; border:1px solid #bae6fd;">
                            <input type="checkbox" id="editAllowMcq" ${c.allowMcqQuestions !== false ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
                            <span style="font-weight:700; color:#0c4a6e;">Allow MCQ Questions</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px; background:white; border-radius:8px; border:1px solid #bae6fd;">
                            <input type="checkbox" id="editAllowCoding" ${c.allowCodingQuestions !== false ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
                            <span style="font-weight:700; color:#0c4a6e;">Allow Coding Questions</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px; background:white; border-radius:8px; border:1px solid #bae6fd;">
                            <input type="checkbox" id="editAllowNumeric" ${c.allowNumericQuestions !== false ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
                            <span style="font-weight:700; color:#0c4a6e;">Allow Numeric Questions</span>
                        </label>
                    </div>
                </div>

                <div style="background:#fef3c7; padding:20px; border-radius:12px; border:2px solid #f59e0b; margin-top:10px;">
                    <h3 style="margin:0 0 15px; color:#92400e; font-size:16px; font-weight:900;">⚙️ Feature Permissions</h3>
                    <div style="display:grid; gap:12px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px; background:white; border-radius:8px; border:1px solid #fde68a;">
                            <input type="checkbox" id="editAllowImages" ${c.allowImageInQuestions !== false ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
                            <span style="font-weight:700; color:#78350f;">Allow Image Handling in Questions</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px; background:white; border-radius:8px; border:1px solid #fde68a;">
                            <input type="checkbox" id="editAllowQuestionBank" ${c.allowQuestionBankAccess !== false ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
                            <span style="font-weight:700; color:#78350f;">Allow Question Bank Access</span>
                        </label>
                    </div>
                </div>

                <div style="background:#f0fdf4; padding:20px; border-radius:12px; border:2px solid #10b981; margin-top:10px;">
                    <h3 style="margin:0 0 15px; color:#065f46; font-size:16px; font-weight:900;">👥 User Limits</h3>
                    <div class="grid-3">
                        <div>
                            <label class="input-label" style="color:#065f46;">Max Faculty</label>
                            <input type="number" id="editMaxFaculty" class="sa-input" value="${c.maxFacultyUsers || 50}" min="1">
                        </div>
                        <div>
                            <label class="input-label" style="color:#065f46;">Max Students</label>
                            <input type="number" id="editMaxStudents" class="sa-input" value="${c.maxStudentUsers || 1000}" min="1">
                        </div>
                        <div>
                            <label class="input-label" style="color:#065f46;">Max Total Users</label>
                            <input type="number" id="editMaxTotal" class="sa-input" value="${c.maxTotalUsers || 1050}" min="1">
                        </div>
                    </div>
                    <p style="font-size:11px; color:#059669; margin:10px 0 0; font-weight:600;">Total includes Faculty + Students + Admins</p>
                </div>
            </div>
        `;
        const btns = `
            <button class="sa-btn" style="background:#f1f5f9; color:#64748b;" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
            <button class="sa-btn" id="editColBtn" onclick="submitEditCollege(${id})">Save Changes</button>
        `;
        showModal("Edit College Details", html, btns);
    } catch (e) {
        showModalAlert(e.message);
    }
}

window.submitEditCollege = async (id) => {
    const btn = document.getElementById("editColBtn");
    btn.textContent = "Saving..."; btn.disabled = true;

    try {
        const data = {
            collegeName: document.getElementById("editColName").value,
            contactEmail: document.getElementById("editColEmail").value,
            contactPhone: document.getElementById("editColPhone").value,
            address: document.getElementById("editColAddr").value,
            // Permission System
            allowMcqQuestions: document.getElementById("editAllowMcq").checked,
            allowCodingQuestions: document.getElementById("editAllowCoding").checked,
            allowNumericQuestions: document.getElementById("editAllowNumeric").checked,
            allowImageInQuestions: document.getElementById("editAllowImages").checked,
            allowQuestionBankAccess: document.getElementById("editAllowQuestionBank").checked,
            maxFacultyUsers: parseInt(document.getElementById("editMaxFaculty").value) || 50,
            maxStudentUsers: parseInt(document.getElementById("editMaxStudents").value) || 1000,
            maxTotalUsers: parseInt(document.getElementById("editMaxTotal").value) || 1050
        };

        if (!data.collegeName || !data.contactEmail) throw new Error("College Name and Email are required.");

        const res = await authFetch(`/api/superadmin/colleges/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            document.getElementById("modalOverlay").style.display = 'none';
            loadColleges();
            showModalAlert("College Updated Successfully with Permissions!", "Success", "✅");
        } else {
            throw new Error(await res.text());
        }
    } catch (e) {
        showModalAlert(e.message);
    } finally {
        if (btn) { btn.textContent = "Save Changes"; btn.disabled = false; }
    }
}

window.submitNewCollege = async () => {
    const btn = document.getElementById("regColBtn");
    btn.textContent = "Processing..."; btn.disabled = true;

    try {
        const data = {
            collegeName: document.getElementById("newColName").value,
            accessCode: document.getElementById("newColCode").value,
            contactEmail: document.getElementById("newColEmail").value,
            contactPhone: document.getElementById("newColPhone").value,
            address: document.getElementById("newColAddr").value,
            adminUsername: document.getElementById("newColAdminUser").value,
            adminPassword: document.getElementById("newColAdminPass").value,
            // Permission System
            allowMcqQuestions: document.getElementById("newAllowMcq").checked,
            allowCodingQuestions: document.getElementById("newAllowCoding").checked,
            allowNumericQuestions: document.getElementById("newAllowNumeric").checked,
            allowImageInQuestions: document.getElementById("newAllowImages").checked,
            allowQuestionBankAccess: document.getElementById("newAllowQuestionBank").checked,
            maxFacultyUsers: parseInt(document.getElementById("newMaxFaculty").value) || 50,
            maxStudentUsers: parseInt(document.getElementById("newMaxStudents").value) || 1000,
            maxTotalUsers: parseInt(document.getElementById("newMaxTotal").value) || 1050
        };

        if (!data.collegeName || !data.contactEmail || !data.adminUsername || !data.adminPassword) {
            throw new Error("College Name, Email, Admin Username and Password are required.");
        }

        const res = await authFetch("/api/superadmin/colleges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            document.getElementById("modalOverlay").style.display = 'none';
            loadColleges();
            showModalAlert("College Registered Successfully with Permissions!", "Success", "✅");
        } else {
            throw new Error(await res.text());
        }
    } catch (e) {
        showModalAlert(e.message);
    } finally {
        if (btn) { btn.textContent = "Register College"; btn.disabled = false; }
    }
}

async function deleteCollege(id) {
    const confirmed = await showModalConfirm("Are you sure you want to delete this college? This action cannot be undone.");
    if (confirmed) {
        try {
            await authFetch(`/api/superadmin/colleges/${id}`, { method: "DELETE" });
            loadColleges();
            showModalAlert("College Deleted Successfully", "Deleted", "🗑️");
        } catch (e) {
            showModalAlert(e.message);
        }
    }
}


// =======================
// 2. QUESTION BANK (ADVANCED)
// =======================
function loadCompanyOptions() {
    authFetch("/api/bank/companies").then(r => r.json()).then(comps => {
        document.getElementById("sfComp").innerHTML = '<option value="">All Companies</option>' + comps.map(c => `<option value="${c}">${c}</option>`).join("");
    });
}
function loadBankQuestions() {
    const comp = document.getElementById("sfComp").value;
    const cat = document.getElementById("sfCat").value;
    const diff = document.getElementById("sfDiff").value;
    const topic = document.getElementById("sfTopic").value;

    authFetch(`/api/bank/filter?company=${encodeURIComponent(comp)}&category=${encodeURIComponent(cat)}&topic=${encodeURIComponent(topic)}&difficulty=${encodeURIComponent(diff)}`)
        .then(r => r.json())
        .then(data => {
            const grid = document.getElementById("bankGrid");
            if (data.length === 0) return grid.innerHTML = `<div style="text-align:center; padding:50px; color:#be185d;">No questions.</div>`;
            grid.innerHTML = data.map(q => {
                let coBadge = "";
                if (q.companies && q.companies.length > 0) {
                    if (q.companies.length === 1) coBadge = `<span class="badge" style="background:#fce7f3; color:#831843;">${q.companies[0]}</span>`;
                    else coBadge = `<span class="badge" style="background:#fce7f3; color:#831843;">${q.companies.length} Companies</span>`;
                } else {
                    coBadge = `<span class="badge" style="background:#f1f5f9; color:#831843;">General</span>`;
                }

                return `
            <div class="sa-card" style="padding:20px; display:flex; gap:15px; align-items:flex-start;">
                <div style="flex:1;">
                    ${coBadge}
                    <span class="badge" style="background:#e0f2fe; color:#0369a1;">${q.questionType}</span>
                    <div style="font-weight:700; color:#1e293b; margin-top:8px;">${q.questionText}</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button class="sa-btn" style="padding:5px 10px; font-size:12px; background:#e0f2fe; color:#0369a1;" onclick="openEditBankQuestionModal('${q.id}')">Edit</button>
                    <button class="sa-btn" style="padding:5px 10px; font-size:12px; background:#fecaca; color:#b91c1c;" onclick="deleteBankQ('${q.id}')">Delete</button>
                </div>
            </div>
            `}).join("");
        });
}

// === ADVANCED EDITOR ===
window.openEditBankQuestionModal = async (id) => {
    try {
        const res = await authFetch(`/api/superadmin/questions/${id}`);
        if (!res.ok) throw new Error("Could not fetch question details");
        const q = await res.json();
        window.openAddBankQuestionModal(q);
    } catch (e) {
        showModalAlert(e.message);
    }
};

window.openAddBankQuestionModal = (editQ = null) => {
    const isEdit = !!editQ;
    const title = isEdit ? "Edit Question" : "Add New Question";
    // Load companies first
    authFetch("/api/bank/companies").then(r => r.json()).then(comps => {
        const coHtml = `
            <div id="selectedCompaniesDisplay" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; min-height:30px; padding:10px; background:white; border-radius:12px; border:2px dashed #fce7f3;">
                <span style="color:#94a3b8; font-size:12px;">No companies selected</span>
            </div>
            <button id="selectCompaniesBtn" class="sa-btn" style="width:100%; font-size:13px; background:#fce7f3; color:#831843; border: 1px solid #fbcfe8;">Select the companies to add this questions</button>
        `;

        const html = `
        <div class="editor-grid" style="gap:20px;">
             <!-- Meta Column -->
             <div style="background:#fdf2f8; padding:20px; border-radius:16px;">
                 <h4 style="margin-top:0; color:#831843;">1. Classification</h4>
                 
                 <label class="input-label">Companies</label>
                 ${coHtml}
                 
                 <div class="grid-2" style="margin-top:10px;">
                     <div><label class="input-label">Category</label>
                        <select id="qCat" class="sa-input"><option>APTITUDE</option><option>VERBAL</option><option>CODING</option></select>
                     </div>
                     <div><label class="input-label">Topic</label><input id="qTop" class="sa-input" placeholder="e.g. DP"></div>
                 </div>
                 
                 <div class="grid-2" style="margin-top:10px;">
                     <div><label class="input-label">Difficulty</label><select id="qDiff" class="sa-input"><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                     <div><label class="input-label">Type</label><select id="qType" class="sa-input" onchange="toggleEditor(this.value)"><option value="MCQ">Multiple Choice</option><option value="CODING">Coding</option></select></div>
                 </div>
                 
                 <div class="grid-3" style="margin-top:10px; display:none;">
                     <div><label class="input-label">Marks</label><input type="number" id="qM" class="sa-input" value="1"></div>
                     <div><label class="input-label">Neg. Marks</label><input type="number" id="qNM" class="sa-input" value="0"></div>
                     <div><label class="input-label">Time (s)</label><input type="number" id="qTime" class="sa-input" value="60"></div>
                 </div>
             </div>
             
             <!-- Content Column -->
             <div>
                 <h4 style="margin-top:0; color:#831843;">2. Content</h4>
                 <label class="input-label">Question Text</label>
                 <textarea id="qTxt" class="sa-input" style="height:120px; font-family:monospace; margin-bottom:10px;"></textarea>
                 
                 <label class="input-label">Image (Optional)</label>
                 <input type="file" id="qImg" class="sa-input" onchange="previewImage(this, 'qImgPrev')">
                 <img id="qImgPrev" style="max-height:100px; display:none; margin-top:5px; border-radius:8px;">
             </div>
        </div>

        <div id="section-mcq" style="margin-top:20px;">
             <div style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:20px;">
                 <h4 style="margin-top:0; display:flex; justify-content:space-between; align-items:center;">
                     <span style="color:#831843;">Options</span>
                     <button onclick="addOptionRow()" style="background:#ec4899; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:700;">+ Add Option</button>
                 </h4>
                 <div id="optionsContainer"></div>
             </div>
        </div>

        <div id="section-coding" style="margin-top:20px; display:none;">
             <h3 style="text-align:center; color:#6366f1; border-bottom:2px solid #e0e7ff; padding-bottom:10px; margin-bottom:20px;">Coding Question Details</h3>
             
             <!-- I/O Formats -->
             <div class="grid-2" style="margin-bottom:15px;">
                 <div><label class="input-label">Input Format</label><textarea id="cIn" class="sa-input" style="height:80px;" placeholder="e.g. First line contains N..."></textarea></div>
                 <div><label class="input-label">Output Format</label><textarea id="cOut" class="sa-input" style="height:80px;" placeholder="e.g. Print the sum of..."></textarea></div>
             </div>

             <!-- Sample Test Cases -->
             <div style="margin-top:20px; background:#f0f9ff; padding:20px; border-radius:16px; border:1px solid #bae6fd; margin-bottom:20px;">
                 <h4 style="margin-top:0; display:flex; justify-content:space-between; align-items:center;">
                     <span style="color:#0369a1;">SAMPLE TEST CASES (VISIBLE TO STUDENTS)</span>
                     <button onclick="addTestCaseRow('sampleCasesContainer')" style="background:#0284c7; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:700;">+ Add Sample Case</button>
                 </h4>
                 <div id="sampleCasesContainer"></div>
             </div>

             <div class="grid-2" style="margin-bottom:15px;">
                <div><label class="input-label">Constraints</label><textarea id="cCons" class="sa-input" style="height:60px;" placeholder="e.g. 1 <= N <= 10^5"></textarea></div>
                <div><label class="input-label">Hints (Optional)</label><textarea id="cHints" class="sa-input" style="height:60px;" placeholder="e.g. Use hash map for O(N)..."></textarea></div>
             </div>
             
             <!-- Hidden Test Cases -->
             <div style="margin-top:20px; background:#f8fafc; padding:20px; border-radius:16px; border:1px solid #e2e8f0; margin-bottom:20px;">
                 <h4 style="margin-top:0; display:flex; justify-content:space-between; align-items:center;">
                     <span style="color:#475569;">HIDDEN TEST CASES (EVALUATED ON SUBMIT)</span>
                     <button onclick="addTestCaseRow('hiddenCasesContainer', '', '', true)" style="background:#64748b; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:700;">+ Add Hidden Case</button>
                 </h4>
                 <div id="hiddenCasesContainer"></div>
             </div>

             <div class="grid-3" style="background:#f1f5f9; padding:15px; border-radius:12px;">
                <div><label class="input-label">Marks</label><input type="number" id="cM" class="sa-input" value="10"></div>
                <div><label class="input-label">Neg. Marks</label><input type="number" id="cNM" class="sa-input" value="0"></div>
                <div><label class="input-label">Time (s)</label><input type="number" id="cTime" class="sa-input" value="60"></div>
             </div>
        </div>
    `;

        const btns = `
        <button class="sa-btn" style="background:#fce7f3; color:#831843;" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
        <button class="sa-btn" id="saveQBtn">Save Question</button>
    `;

        showModal(title, html, btns);

        let currentlySelectedCompanies = isEdit ? (editQ.companies || []) : [];

        // Pre-fill fields if editing
        if (isEdit) {
            document.getElementById("qCat").value = editQ.category;
            document.getElementById("qTop").value = editQ.topic || "";
            document.getElementById("qDiff").value = editQ.difficulty || "Easy";
            document.getElementById("qType").value = editQ.questionType;
            document.getElementById("qTxt").value = editQ.questionText;
            if (editQ.questionImage) {
                const img = document.getElementById("qImgPrev");
                img.src = editQ.questionImage;
                img.style.display = "block";
            }
        }


        const updateCompanyDisplay = () => {
            const display = document.getElementById("selectedCompaniesDisplay");
            if (currentlySelectedCompanies.length === 0) {
                display.innerHTML = '<span style="color:#94a3b8; font-size:12px;">No companies selected</span>';
            } else {
                display.innerHTML = currentlySelectedCompanies.map(c => `
                    <span style="background:#fdf2f8; color:#831843; border:1px solid #fbcfe8; padding:4px 12px; border-radius:100px; font-size:11px; font-weight:800; display:flex; align-items:center; gap:5px;">
                        ${c}
                        <b style="cursor:pointer; font-size:14px;" onclick="removeSelectedCompany('${c}')">&times;</b>
                    </span>
                `).join("");
            }
        };

        window.removeSelectedCompany = (name) => {
            currentlySelectedCompanies = currentlySelectedCompanies.filter(c => c !== name);
            updateCompanyDisplay();
        };

        document.getElementById("selectCompaniesBtn").onclick = () => {
            authFetch("/api/bank/companies").then(r => r.json()).then(comps => {
                const overlaySelection = document.createElement("div");
                overlaySelection.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); backdrop-filter:blur(5px); z-index:3000; display:flex; align-items:center; justify-content:center; padding:20px;";

                const listHtml = comps.map(c => `
                    <label style="display:flex; align-items:center; gap:15px; padding:15px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; cursor:pointer; transition:0.2s;" class="co-select-item">
                        <input type="checkbox" class="co-checkbox" value="${c}" ${currentlySelectedCompanies.includes(c) ? 'checked' : ''} style="width:20px; height:20px; accent-color:#ec4899;">
                        <span style="font-weight:700; color:#1e293b;">${c}</span>
                    </label>
                `).join("");

                overlaySelection.innerHTML = `
                    <div style="background:white; width:95%; max-width:500px; padding:35px; border-radius:28px; box-shadow:0 30px 60px rgba(0,0,0,0.3); border:1px solid #fbcfe8;">
                        <h2 style="margin:0 0 10px; font-weight:900; color:#831843;">Select Companies</h2>
                        <p style="color:#be185d; font-size:14px; margin-bottom:20px; font-weight:600;">Choose one or more companies for this question.</p>
                        <div style="max-height:400px; overflow-y:auto; display:flex; flex-direction:column; gap:10px; padding-right:10px; margin-bottom:25px;" id="coSelectionList">
                            ${listHtml || '<div style="text-align:center; padding:30px; color:#94a3b8;">No companies available.</div>'}
                        </div>
                        <div style="display:flex; gap:12px;">
                            <button id="cancelCoSel" class="sa-btn" style="background:#f1f5f9; color:#64748b; flex:1;">Cancel</button>
                            <button id="applyCoSel" class="sa-btn" style="flex:1;">Apply Selection</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlaySelection);

                overlaySelection.querySelector("#cancelCoSel").onclick = () => document.body.removeChild(overlaySelection);
                overlaySelection.querySelector("#applyCoSel").onclick = () => {
                    const checked = Array.from(overlaySelection.querySelectorAll(".co-checkbox:checked")).map(cb => cb.value);
                    currentlySelectedCompanies = checked;
                    updateCompanyDisplay();
                    document.body.removeChild(overlaySelection);
                };
            });
        };

        // --- Editor Logic ---
        window.toggleEditor = (t) => {
            document.getElementById("section-mcq").style.display = t === "MCQ" ? "block" : "none";
            document.getElementById("section-coding").style.display = t === "CODING" ? "block" : "none";
        };

        // Option Manager
        window.addOptionRow = (val = "", isCorr = false, imgData = null) => {
            const div = document.createElement("div");
            div.className = "opt-row";
            div.style = "display:flex; gap:10px; align-items:center; margin-bottom:10px; padding:10px; border:1px solid #f1f5f9; border-radius:10px;";
            div.innerHTML = `
            <input type="radio" name="optCorrect" class="opt-radio" style="width:20px; height:20px;" ${isCorr ? 'checked' : ''}>
            <div style="flex:1;">
                <input class="sa-input opt-text" placeholder="Option Text" value="${val}">
                <input type="file" class="opt-img" style="font-size:11px; margin-top:5px;">
                ${imgData ? `<div class="opt-img-preview"><img src="${imgData}" style="max-height:40px; margin-top:5px; border-radius:4px;"></div>` : ''}
            </div>
            <button onclick="this.parentElement.remove()" style="background:#fee2e2; color:#ef4444; border:none; width:30px; height:30px; border-radius:6px; cursor:pointer;">&times;</button>
        `;
            document.getElementById("optionsContainer").appendChild(div);
        };

        // Initial options
        if (isEdit && editQ.questionType === "MCQ") {
            (editQ.choices || []).forEach((c, idx) => {
                const isCorr = editQ.correctOption === c;
                const img = (editQ.choiceImages || [])[idx];
                addOptionRow(c, isCorr, img);
            });
        } else if (!isEdit) {
            addOptionRow(); addOptionRow();
        }

        // TestCase Manager
        window.addTestCaseRow = (containerId, inp = "", out = "", hide = false) => {
            const div = document.createElement("div");
            div.className = "case-row";
            div.style = "gap:10px; align-items:start; margin-bottom:10px; padding:15px; background:white; border-radius:12px; border:1px solid #e2e8f0; position:relative; display:grid; grid-template-columns: 1fr 1fr;";
            div.innerHTML = `
                <button onclick="this.parentElement.remove()" style="position:absolute; top:-5px; right:-5px; background:#ef4444; color:white; border:none; width:22px; height:22px; border-radius:50%; cursor:pointer; font-size:12px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); z-index:10;">&times;</button>
                <div>
                   <label class="input-label" style="margin-top:0;">${containerId.includes('sample') ? 'Sample Input' : 'Input'}</label>
                   <textarea class="sa-input case-in" placeholder="Input" style="height:50px; padding:8px; font-size:12px;">${inp}</textarea>
                </div>
                <div>
                   <label class="input-label" style="margin-top:0;">${containerId.includes('sample') ? 'Sample Output' : 'Expected Output'}</label>
                   <textarea class="sa-input case-out" placeholder="e.g. 15" style="height:50px; padding:8px; font-size:12px;">${out}</textarea>
                </div>
                <input type="hidden" class="case-hide" value="${hide}">
            `;
            document.getElementById(containerId).appendChild(div);
        };

        // Initialize display
        updateCompanyDisplay();

        if (isEdit && editQ.questionType === "CODING") {
            document.getElementById("cIn").value = editQ.inputFormat || "";
            document.getElementById("cOut").value = editQ.outputFormat || "";
            document.getElementById("cCons").value = editQ.constraints || "";
            document.getElementById("cHints").value = editQ.hints || "";
            document.getElementById("cM").value = editQ.defaultMarks || 10;
            document.getElementById("cNM").value = editQ.defaultNegativeMarks || 0;
            document.getElementById("cTime").value = editQ.defaultTimeLimit || 60;

            toggleEditor("CODING");
            try {
                const tcs = JSON.parse(editQ.testCases || "[]");
                if (tcs.length > 0) {
                    tcs.forEach(tc => {
                        const target = tc.hidden ? 'hiddenCasesContainer' : 'sampleCasesContainer';
                        addTestCaseRow(target, tc.input, tc.expectedOutput, tc.hidden);
                    });
                } else {
                    addTestCaseRow('sampleCasesContainer');
                    addTestCaseRow('hiddenCasesContainer', '', '', true);
                }
            } catch (e) {
                console.error("TC parse fail", e);
                addTestCaseRow('sampleCasesContainer');
            }
        } else if (!isEdit) {
            // Defaults for new coding
        }

        window.previewImage = (input, imgId) => {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.getElementById(imgId);
                    img.src = e.target.result;
                    img.style.display = "block";
                };
                reader.readAsDataURL(input.files[0]);
            }
        };

        // Helper: Convert file to Base64 Promise
        const fileToBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        // SAVE LOGIC
        document.getElementById("saveQBtn").onclick = async () => {
            const btn = document.getElementById("saveQBtn");
            btn.textContent = "Saving..."; btn.disabled = true;

            try {
                // General Fields
                const q = {
                    companies: currentlySelectedCompanies,
                    category: document.getElementById("qCat").value,
                    topic: document.getElementById("qTop").value,
                    difficulty: document.getElementById("qDiff").value,
                    questionType: document.getElementById("qType").value,
                    questionText: document.getElementById("qTxt").value,
                    defaultMarks: document.getElementById("qType").value === "CODING" ? 10 : 1, // Store default for bank
                    defaultNegativeMarks: 0,
                    defaultTimeLimit: 60
                };

                // Image
                const imgInput = document.getElementById("qImg");
                if (imgInput.files[0]) q.questionImage = await fileToBase64(imgInput.files[0]);

                // Type Specifics
                if (q.questionType === "MCQ") {
                    q.choices = [];
                    q.choiceImages = [];

                    const rows = document.querySelectorAll(".opt-row");
                    for (let r of rows) {
                        const txt = r.querySelector(".opt-text").value;
                        const f = r.querySelector(".opt-img").files[0];
                        const isCorr = r.querySelector(".opt-radio").checked;

                        if (txt) {
                            q.choices.push(txt);
                            q.choiceImages.push(f ? await fileToBase64(f) : null); // Backend should handle nulls or we send "N/A"
                            // Handle Correct Option logic
                            if (isCorr) q.correctOption = txt; // Assuming text match for now
                        }
                    }

                    if (!q.correctOption && q.choices.length > 0) q.correctOption = q.choices[0];

                } else {
                    // Coding
                    q.inputFormat = document.getElementById("cIn").value;
                    q.outputFormat = document.getElementById("cOut").value;
                    q.constraints = document.getElementById("cCons").value;
                    q.hints = document.getElementById("cHints").value;
                    q.defaultMarks = document.getElementById("cM").value;
                    q.defaultNegativeMarks = document.getElementById("cNM").value;
                    q.defaultTimeLimit = document.getElementById("cTime").value;

                    const cases = [];
                    const collectCases = (containerId) => {
                        const container = document.getElementById(containerId);
                        const cRows = container.querySelectorAll(".case-row");
                        cRows.forEach(r => {
                            const tcIn = r.querySelector(".case-in").value;
                            const tcOut = r.querySelector(".case-out").value;
                            const tcHide = r.querySelector(".case-hide").value === 'true';
                            if (tcIn || tcOut) {
                                cases.push({
                                    input: tcIn,
                                    expectedOutput: tcOut,
                                    hidden: tcHide
                                });
                            }
                        });
                    };

                    collectCases('sampleCasesContainer');
                    collectCases('hiddenCasesContainer');

                    if (cases.length > 0) {
                        const firstSample = cases.find(c => !c.hidden) || cases[0];
                        q.sampleInput = firstSample.input;
                        q.sampleOutput = firstSample.expectedOutput;
                    }
                    q.testCases = JSON.stringify(cases);
                }

                if (currentlySelectedCompanies.length === 0 || !q.questionText) throw new Error("At least one Company is required. Question Text is required.");

                // POST or PUT
                const url = isEdit ? `/api/superadmin/questions/${editQ.id}` : "/api/superadmin/questions";
                const method = isEdit ? "PUT" : "POST";
                const res = await authFetch(url, {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(q)
                });

                if (res.ok) {
                    document.getElementById("modalOverlay").style.display = "none";
                    loadBankQuestions();
                    showModalAlert("Question Saved Successfully!", "Success", "✅");
                    // Also refresh companies because we might have added a new one optimistically
                    loadCompanyOptions();
                } else {
                    throw new Error(await res.text());
                }

            } catch (e) {
                showModalAlert(e.message);
            } finally {
                btn.textContent = "Save Question"; btn.disabled = false;
            }
        };

    }); // End fetch
}

// Global helper for adding company
// Global helper for adding company

window.openManageCompaniesModal = () => {
    authFetch("/api/superadmin/companies").then(r => r.json()).then(comps => {
        if (!Array.isArray(comps)) {
            console.error("Expected array of companies but got:", comps);
            return showModalAlert("Failed to load companies list. Please ensure the backend is running correctly.", "System Error", "❌");
        }
        const listHtml = comps.map(c => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:#fdf2f8; border:1px solid #fbcfe8; border-radius:15px; margin-bottom:10px;">
                <div style="flex:1;">
                    <div style="font-weight:900; color:#831843; font-size:16px;">${c.name}</div>
                    <div style="font-size:11px; color:#be185d;">${c.description || 'No description'}</div>
                </div>
                <button class="sa-mini-btn" style="color:#ef4444; font-size:10px;" onclick="deleteCompany(${c.id})">Delete</button>
            </div>
        `).join("");

        const html = `
            <div style="display:flex; justify-content:space-between; margin-bottom:20px; align-items:center; border-bottom:1px dashed #fce7f3; padding-bottom:15px;">
                <h3 style="margin:0; color:#831843;">Active Companies</h3>
                <button class="sa-btn" style="font-size:12px; padding:8px 15px;" onclick="openAddCompanyModal()">+ Add New</button>
            </div>
            <div style="max-height:400px; overflow-y:auto; padding-right:10px;">
                ${listHtml || '<div style="text-align:center; padding:30px; color:#94a3b8;">No companies registered yet.</div>'}
            </div>
        `;
        showModal("Manage Companies", html);
    });
}

window.deleteCompany = async (id) => {
    const confirmed = await showModalConfirm("Are you sure? This will remove the company from the global bank. (Linked questions will remain but won't be matched to this company)");
    if (confirmed) {
        authFetch(`/api/superadmin/companies/${id}`, { method: "DELETE" }).then(() => {
            openManageCompaniesModal();
            loadCompanyOptions();
        });
    }
}

window.openAddCompanyModal = () => {
    const html = `
        <div>
            <label class="input-label">Company Name</label>
            <input id="newCompName" class="sa-input" placeholder="e.g. Microsoft">
            
            <label class="input-label" style="margin-top:15px;">Description (Optional)</label>
            <textarea id="newCompDesc" class="sa-input" style="height:80px;" placeholder="Tech giant..."></textarea>
        </div>
    `;
    const btns = `
         <button class="sa-btn" style="background:#fce7f3; color:#831843;" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
         <button class="sa-btn" onclick="submitNewCompany()">Add Company</button>
    `;
    showModal("Add New Company", html, btns);
}

window.submitNewCompany = async () => {
    const name = document.getElementById("newCompName").value;
    const desc = document.getElementById("newCompDesc").value;

    if (!name) return showModalAlert("Company Name is required");

    try {
        // Using a new endpoint for managing companies directly
        const res = await authFetch("/api/superadmin/companies/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name, description: desc })
        });

        if (res.ok) {
            document.getElementById("modalOverlay").style.display = 'none';
            showModalAlert("Company Added!", "Success", "✅");
            loadCompanyOptions(); // Refresh the list if open or for next time
        } else {
            showModalAlert("Error: " + await res.text());
        }
    } catch (e) {
        showModalAlert("Error: " + e.message);
    }
}
async function deleteBankQ(id) {
    const confirmed = await showModalConfirm("Are you sure you want to delete this question?");
    if (confirmed) {
        authFetch(`/api/superadmin/questions/${id}`, { method: "DELETE" }).then(() => {
            loadBankQuestions();
            showModalAlert("Question Deleted", "Deleted", "🗑️");
        });
    }
}

document.getElementById("sfBtn").onclick = loadBankQuestions;
loadColleges();
loadCompanyOptions();
loadBankQuestions();
// =======================
// 3. CONTENT MANAGEMENT (Courses & Training Approach)
// =======================

async function loadCoursesAdmin() {
    const list = document.getElementById("coursesAdminList");
    if (!list) return;
    try {
        const res = await authFetch("/api/superadmin/content/courses");
        if (!res.ok) throw new Error("Fetch failed with status: " + res.status);
        const data = await res.json();
        if (!Array.isArray(data)) {
            console.error("Expected array for courses, got:", data);
            list.innerHTML = `<p style="text-align:center; color:#be185d;">System error: Invalid data format.</p>`;
            return;
        }
        if (data.length === 0) {
            list.innerHTML = `<p style="text-align:center; color:#be185d;">No courses found.</p>`;
            return;
        }
        list.innerHTML = data.map(c => `
            <div class="sa-card" style="padding:15px; display:flex; gap:15px; align-items:center;">
                <img src="${c.imageUrl || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:700; color:#1e293b;">${c.name}</div>
                    <div style="font-size:12px; color:#64748b;">${c.startDate || 'N/A'} to ${c.endDate || 'N/A'}</div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="sa-mini-btn" style="color:#0ea5e9;" onclick="openEditCourseModal(${c.id})">Edit</button>
                    <button class="sa-mini-btn" style="color:#ef4444;" onclick="deleteCourse(${c.id})">Delete</button>
                </div>
            </div>
        `).join("");
    } catch (e) {
        console.error("Course Admin Load Error:", e);
        list.innerHTML = `<p style="text-align:center; color:#be185d;">Error loading courses. Please check connection.</p>`;
    }
}

async function loadApproachesAdmin() {
    const list = document.getElementById("approachesAdminList");
    if (!list) return;
    try {
        const res = await authFetch("/api/superadmin/content/approaches");
        if (!res.ok) throw new Error("Fetch failed with status: " + res.status);
        const data = await res.json();
        if (!Array.isArray(data)) {
            console.error("Expected array for approaches, got:", data);
            list.innerHTML = `<p style="text-align:center; color:#be185d;">System error: Invalid data format.</p>`;
            return;
        }
        if (data.length === 0) {
            list.innerHTML = `<p style="text-align:center; color:#be185d;">No topics found.</p>`;
            return;
        }
        list.innerHTML = data.map(a => `
            <div class="sa-card" style="padding:15px; display:flex; gap:15px; align-items:center;">
                <img src="${a.imageUrl || 'https://via.placeholder.com/50'}" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:700; color:#1e293b;">${a.title}</div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="sa-mini-btn" style="color:#0ea5e9;" onclick="openEditApproachModal(${a.id})">Edit</button>
                    <button class="sa-mini-btn" style="color:#ef4444;" onclick="deleteApproach(${a.id})">Delete</button>
                </div>
            </div>
        `).join("");
    } catch (e) {
        console.error("Approach Admin Load Error:", e);
        list.innerHTML = `<p style="text-align:center; color:#be185d;">Error loading approaches.</p>`;
    }
}

// Course Modals
window.openAddCourseModal = () => openCourseModal();
window.openEditCourseModal = async (id) => {
    const res = await authFetch(`/api/superadmin/content/courses`);
    const courses = await res.json();
    const course = courses.find(c => c.id === id);
    openCourseModal(course);
};

function openCourseModal(c = null) {
    const isEdit = !!c;
    const title = isEdit ? "Edit Course" : "Add New Course";
    const html = `
        <div style="display:grid; gap:15px;" id="courseModalForm">
            <div>
                <label class="input-label">Course Name *</label>
                <input id="cName" class="sa-input" value="${c ? c.name : ''}">
            </div>
            <div>
                <label class="input-label">Description (Short summary)</label>
                <textarea id="cDesc" class="sa-input" style="height:60px;">${c ? c.description : ''}</textarea>
            </div>
            <div class="grid-2">
                <div>
                    <label class="input-label">Choose Course Image</label>
                    <input type="file" id="cImgFile" class="sa-input" accept="image/*" onchange="previewImage(this, 'cImgPrev')">
                </div>
                <div style="text-align:center;">
                    <img id="cImgPrev" src="${c ? c.imageUrl : ''}" style="max-height:80px; ${c && c.imageUrl ? '' : 'display:none;'} border-radius:8px; border:1px solid #ddd;">
                </div>
            </div>
            <div>
                <label class="input-label">Syllabus Details (Topics & Description)</label>
                <textarea id="cSyllabus" class="sa-input" style="height:120px;" placeholder="Enter detailed topics, one per line...">${c ? c.syllabus : ''}</textarea>
            </div>
            <div class="grid-2">
                <div>
                    <label class="input-label">Start Date</label>
                    <input type="date" id="cStart" class="sa-input" value="${c ? c.startDate : ''}">
                </div>
                <div>
                    <label class="input-label">End Date</label>
                    <input type="date" id="cEnd" class="sa-input" value="${c ? c.endDate : ''}">
                </div>
            </div>
        </div>
    `;
    const btns = `
        <button class="sa-btn" style="background:#fce7f3; color:#831843;" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
        <button class="sa-btn" id="courseSaveBtn" onclick="saveCourse(${c ? c.id : 'null'})">Save Course</button>
    `;
    showModal(title, html, btns);
}

window.saveCourse = async (id) => {
    const btn = document.getElementById("courseSaveBtn");
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
        const imgFile = document.getElementById("cImgFile").files[0];
        let imageUrl = document.getElementById("cImgPrev").src;

        if (imgFile) {
            imageUrl = await fileToBase64(imgFile);
        }

        const data = {
            id: id,
            name: document.getElementById("cName").value,
            description: document.getElementById("cDesc").value,
            imageUrl: imageUrl,
            syllabus: document.getElementById("cSyllabus").value,
            startDate: document.getElementById("cStart").value || null,
            endDate: document.getElementById("cEnd").value || null
        };

        const res = await authFetch("/api/superadmin/content/courses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            document.getElementById("modalOverlay").style.display = 'none';
            loadCoursesAdmin();
            showModalAlert("Course Successfully Saved!", "Success", "✅");
        } else {
            throw new Error(await res.text());
        }
    } catch (e) {
        showModalAlert(e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Save Course";
    }
}

window.deleteCourse = async (id) => {
    if (await showModalConfirm("Delete this course?")) {
        await authFetch(`/api/superadmin/content/courses/${id}`, { method: "DELETE" });
        loadCoursesAdmin();
    }
}

// Training Approach Modals
window.openAddApproachModal = () => openApproachModal();
window.openEditApproachModal = async (id) => {
    const res = await authFetch(`/api/superadmin/content/approaches`);
    const apps = await res.json();
    const app = apps.find(a => a.id === id);
    openApproachModal(app);
};

function openApproachModal(a = null) {
    const isEdit = !!a;
    const title = isEdit ? "Edit Approach" : "Add New Approach";
    const html = `
        <div style="display:grid; gap:15px;">
            <div>
                <label class="input-label">Title *</label>
                <input id="aTitle" class="sa-input" value="${a ? a.title : ''}">
            </div>
            <div>
                <label class="input-label">Description</label>
                <textarea id="aDesc" class="sa-input" style="height:80px;">${a ? a.description : ''}</textarea>
            </div>
            <div class="grid-2">
                <div>
                    <label class="input-label">Choose Step Image</label>
                    <input type="file" id="aImgFile" class="sa-input" accept="image/*" onchange="previewImage(this, 'aImgPrev')">
                </div>
                <div style="text-align:center;">
                    <img id="aImgPrev" src="${a ? a.imageUrl : ''}" style="max-height:80px; ${a && a.imageUrl ? '' : 'display:none;'} border-radius:8px; border:1px solid #ddd;">
                </div>
            </div>
        </div>
    `;
    const btns = `
        <button class="sa-btn" style="background:#fce7f3; color:#831843;" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
        <button class="sa-btn" id="appSaveBtn" onclick="saveApproach(${a ? a.id : 'null'})">Save Approach</button>
    `;
    showModal(title, html, btns);
}

window.saveApproach = async (id) => {
    const btn = document.getElementById("appSaveBtn");
    btn.disabled = true;
    btn.textContent = "Saving...";
    try {
        const imgFile = document.getElementById("aImgFile").files[0];
        let imageUrl = document.getElementById("aImgPrev").src;
        if (imgFile) imageUrl = await fileToBase64(imgFile);

        const data = {
            id: id,
            title: document.getElementById("aTitle").value,
            description: document.getElementById("aDesc").value,
            imageUrl: imageUrl
        };
        const res = await authFetch("/api/superadmin/content/approaches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            document.getElementById("modalOverlay").style.display = 'none';
            loadApproachesAdmin();
            showModalAlert("Approach Saved!", "Success", "✅");
        }
    } catch (e) { showModalAlert(e.message); }
    finally { btn.disabled = false; btn.textContent = "Save Approach"; }
}

window.deleteApproach = async (id) => {
    if (await showModalConfirm("Delete this approach?")) {
        await authFetch(`/api/superadmin/content/approaches/${id}`, { method: "DELETE" });
        loadApproachesAdmin();
    }
}
// =======================
// HELPERS FOR IMAGES
// =======================

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

// --- CMS Content Management ---
function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.getElementById(previewId);
            img.src = e.target.result;
            img.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// --- CMS Content Management ---

// Courses
async function loadCoursesAdmin() {
    const list = document.getElementById("coursesAdminList");
    if (!list) return;
    try {
        const res = await authFetch("/api/superadmin/content/courses");
        const data = await res.json();
        list.innerHTML = data.map(c => `
            <div class="sa-card" style="padding:15px; display:flex; gap:15px; align-items:center;">
                <img src="${c.imageUrl || 'https://via.placeholder.com/60'}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:900; color:#1e293b; font-size:16px;">${c.name}</div>
                    <div style="font-size:12px; color:#be185d; font-weight:700;">${c.startDate ? new Date(c.startDate).toLocaleDateString() : 'No Start Date'}</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button class="sa-mini-btn" style="color:#0ea5e9;" onclick="openEditCourseModal(${c.id})">Edit</button>
                    <button class="sa-mini-btn" style="color:#ef4444;" onclick="deleteCourse(${c.id})">Delete</button>
                </div>
            </div>
        `).join("");
    } catch (e) { console.error("Courses Error:", e); }
}

async function loadApproachesAdmin() {
    const list = document.getElementById("approachesAdminList");
    if (!list) return;
    try {
        const res = await authFetch("/api/superadmin/content/approaches");
        const data = await res.json();
        list.innerHTML = data.map(a => `
            <div class="sa-card" style="padding:15px; display:flex; gap:15px; align-items:center;">
                <img src="${a.imageUrl || 'https://via.placeholder.com/60'}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:900; color:#1e293b; font-size:16px;">${a.title}</div>
                    <div style="font-size:12px; color:#64748b;">${a.description ? a.description.substring(0, 50) + '...' : ''}</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button class="sa-mini-btn" style="color:#0ea5e9;" onclick="openEditApproachModal(${a.id})">Edit</button>
                    <button class="sa-mini-btn" style="color:#ef4444;" onclick="deleteApproach(${a.id})">Delete</button>
                </div>
            </div>
        `).join("");
    } catch (e) {
        console.error("Approach Admin Load Error:", e);
        list.innerHTML = `<p style="text-align:center; color:#be185d;">Error loading approaches.</p>`;
    }
}

// Portal Info
async function loadPortalInfoAdmin() {
    try {
        const res = await authFetch("/api/superadmin/content/portal-info");
        const data = await res.json();
        if (data) {
            // Contacts
            document.getElementById("portalEmail").value = data.contactEmail || "";
            document.getElementById("portalInsta").value = data.contactInsta || "";
            document.getElementById("portalPhone").value = data.contactPhone || "";
        }
    } catch (e) { console.error("Portal Info Load Error", e); }
}

window.savePortalInfoAdmin = async () => {
    const data = {
        contactEmail: document.getElementById("portalEmail").value,
        contactInsta: document.getElementById("portalInsta").value,
        contactPhone: document.getElementById("portalPhone").value
    };
    try {
        const res = await authFetch("/api/superadmin/content/portal-info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) showModalAlert("Contact Details Updated!", "Success", "✅");
    } catch (e) { showModalAlert(e.message); }
};

window.loadContactMessages = async () => {
    try {
        const res = await authFetch("/api/superadmin/content/messages");
        const msgs = await res.json();
        const container = document.getElementById("contactMessagesList");
        if (msgs.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#be185d;">No messages to display.</p>';
            return;
        }
        container.innerHTML = msgs.map(m => `
            <div style="background:#fdf2f8; padding:15px; border-radius:12px; border:1px solid #fce7f3; position:relative;">
                <button onclick="deleteContactMessage(${m.id})" style="position:absolute; top:10px; right:10px; background:none; border:none; color:#be185d; cursor:pointer; font-weight:bold;">✕</button>
                <div style="font-size:12px; color:#be185d; font-weight:700; margin-bottom:5px;">From: ${m.name} (${m.email})</div>
                <div style="font-size:11px; color:#64748b; margin-bottom:8px;">Phone: ${m.phone} | ${new Date(m.submittedAt).toLocaleString()}</div>
                <div style="font-weight:800; color:#831843; margin-bottom:5px;">${m.subject}</div>
                <div style="font-size:13px; color:#1e293b; line-height:1.5;">${m.message}</div>
            </div>
        `).join("");
    } catch (e) { console.error("Messages Load Error", e); }
};

window.deleteContactMessage = async (id) => {
    if (await showModalConfirm("Delete this message?")) {
        await authFetch(`/api/superadmin/content/messages/${id}`, { method: "DELETE" });
        loadContactMessages();
    }
};

// Founder
async function loadFounderAdmin() {
    try {
        const res = await authFetch("/api/superadmin/content/founder");
        const data = await res.json();
        if (data) {
            document.getElementById("fName").value = data.name || "";
            document.getElementById("fTitle").value = data.title || "";
            document.getElementById("fIntro").value = data.intro || "";
            document.getElementById("fMessage").value = data.message || "";
            if (data.imageUrl) {
                document.getElementById("fImgPrev").src = data.imageUrl;
            }
        }
    } catch (e) { console.error("Founder Error:", e); }
}

window.saveFounderAdmin = async () => {
    const imgFile = document.getElementById("fImgFile").files[0];
    let imageUrl = document.getElementById("fImgPrev").src;
    if (imgFile) imageUrl = await fileToBase64(imgFile);

    const data = {
        name: document.getElementById("fName").value,
        title: document.getElementById("fTitle").value,
        intro: document.getElementById("fIntro").value,
        message: document.getElementById("fMessage").value,
        imageUrl: imageUrl
    };
    try {
        const res = await authFetch("/api/superadmin/content/founder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) showModalAlert("Founder Profile Updated!", "Success", "✅");
    } catch (e) { showModalAlert("Error: " + e.message); }
};

// Trainers
async function loadTrainersAdmin() {
    const list = document.getElementById("trainersAdminList");
    if (!list) return;
    try {
        const res = await authFetch("/api/superadmin/content/trainers");
        const data = await res.json();
        list.innerHTML = data.map(t => `
            <div class="sa-card" style="padding:15px; display:flex; gap:15px; align-items:center;">
                <img src="${t.imageUrl || 'https://via.placeholder.com/60'}" style="width:60px; height:60px; border-radius:50%; object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:900; color:#1e293b; font-size:16px;">${t.name}</div>
                    <div style="font-size:12px; color:#be185d; font-weight:700;">${t.expertise || 'Expert'}</div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button class="sa-mini-btn" style="color:#0ea5e9;" onclick="openEditTrainerModal(${t.id})">Edit</button>
                    <button class="sa-mini-btn" style="color:#ef4444;" onclick="deleteTrainer(${t.id})">Delete</button>
                </div>
            </div>
        `).join("");
    } catch (e) { console.error("Trainers Error:", e); }
}

window.openAddTrainerModal = () => openTrainerModal();
window.openEditTrainerModal = async (id) => {
    const res = await authFetch("/api/superadmin/content/trainers");
    const trainers = await res.json();
    const trainer = trainers.find(t => t.id === id);
    openTrainerModal(trainer);
};

function openTrainerModal(t = null) {
    const isEdit = !!t;
    const title = isEdit ? "Edit Trainer Profile" : "Add New Trainer";
    const html = `
        <div style="display:grid; gap:15px;">
            <div class="grid-2">
                <div>
                    <label class="input-label">Trainer Name *</label>
                    <input id="trName" class="sa-input" value="${t ? t.name : ''}">
                </div>
                <div>
                    <label class="input-label">Expertise Area</label>
                    <input id="trExpertise" class="sa-input" value="${t ? t.expertise : ''}" placeholder="e.g. Full Stack Development">
                </div>
            </div>
            <div class="grid-2">
                <div>
                    <label class="input-label">Qualification</label>
                    <input id="trQual" class="sa-input" value="${t ? t.qualification : ''}">
                </div>
                <div>
                    <label class="input-label">Experience (Years/Industry)</label>
                    <input id="trExp" class="sa-input" value="${t ? t.experience : ''}">
                </div>
            </div>
            <div class="grid-2">
                <div>
                    <label class="input-label">Choose Profile Photo</label>
                    <input type="file" id="trImgFile" class="sa-input" accept="image/*" onchange="previewImage(this, 'trImgPrev')">
                </div>
                <div style="text-align:center;">
                    <img id="trImgPrev" src="${t ? t.imageUrl : ''}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; ${t && t.imageUrl ? '' : 'display:none;'} border:2px solid #ddd;">
                </div>
            </div>
            <div>
                <label class="input-label">Achievements / Bio</label>
                <textarea id="trAchiv" class="sa-input" style="height:100px;">${t ? t.achievements : ''}</textarea>
            </div>
        </div>
    `;
    const btns = `
        <button class="sa-btn" style="background:#fce7f3; color:#831843;" onclick="document.getElementById('modalOverlay').style.display='none'">Cancel</button>
        <button class="sa-btn" id="trainerSaveBtn" onclick="saveTrainer(${t ? t.id : 'null'})">Save Trainer</button>
    `;
    showModal(title, html, btns);
}

window.saveTrainer = async (id) => {
    const btn = document.getElementById("trainerSaveBtn");
    btn.disabled = true; btn.textContent = "Saving...";
    try {
        const imgFile = document.getElementById("trImgFile").files[0];
        let imageUrl = document.getElementById("trImgPrev").src;
        if (imgFile) imageUrl = await fileToBase64(imgFile);

        const data = {
            id: id,
            name: document.getElementById("trName").value,
            expertise: document.getElementById("trExpertise").value,
            qualification: document.getElementById("trQual").value,
            experience: document.getElementById("trExp").value,
            achievements: document.getElementById("trAchiv").value,
            imageUrl: imageUrl
        };
        const res = await authFetch("/api/superadmin/content/trainers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            document.getElementById("modalOverlay").style.display = 'none';
            loadTrainersAdmin();
            showModalAlert("Trainer Profile Saved!", "Success", "✅");
        }
    } catch (e) { showModalAlert(e.message); }
    finally { btn.disabled = false; btn.textContent = "Save Trainer"; }
};

// Super Admin Profile Login/Display
async function loadSAProfile() {
    try {
        const res = await authFetch("/api/superadmin/content/profile");
        const data = await res.json();
        if (data) {
            if (data.displayName) {
                document.getElementById("saDisplayName").textContent = data.displayName;
                document.getElementById("saDisplayNameInput").value = data.displayName;
            }
            if (data.profilePhoto) {
                document.getElementById("saProfileImg").src = data.profilePhoto;
                document.getElementById("saSettingImg").src = data.profilePhoto;
            }
        }
    } catch (e) { console.error("SA Profile Error:", e); }
}

window.saveSAProfile = async () => {
    const imgFile = document.getElementById("saProfileFile").files[0];
    let photoUrl = document.getElementById("saSettingImg").src;
    if (imgFile) photoUrl = await fileToBase64(imgFile);

    const data = {
        displayName: document.getElementById("saDisplayNameInput").value,
        profilePhoto: photoUrl
    };
    try {
        const res = await authFetch("/api/superadmin/content/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            loadSAProfile();
            showModalAlert("Profile Updated Sucessfully!", "Success", "👤");
        }
    } catch (e) { showModalAlert(e.message); }
};

window.scrollToProfileSettings = () => {
    // Switch to content tab if not already there
    document.querySelector('.sa-tab[data-tab="content"]').click();
    setTimeout(() => {
        document.getElementById("saProfileSettings").scrollIntoView({ behavior: 'smooth' });
    }, 100);
};

// Initial load of profile for the top bar
loadSAProfile();

window.logout = () => {
    sessionStorage.clear();
    location.href = "/";
};
