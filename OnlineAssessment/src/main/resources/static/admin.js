(function () {
    // ------------------ SELECT ELEMENTS ------------------
    const adminDashboard = document.getElementById("adminDashboard");
    const manageDeptBtn = document.getElementById("manageDepartmentsBtn");

    // Student Data Elements
    const manageStudentDataBtn = document.getElementById("manageStudentDataBtn");
    const manageStudentSection = document.getElementById("manageStudentSection");
    const backFromManageStudents = document.getElementById("backFromManageStudents");
    const uploadStudentAdminBtn = document.getElementById("uploadStudentAdminBtn");
    const viewStudentsBtn = document.getElementById("viewStudentsBtn");
    const downloadStudentsCardBtn = document.getElementById("downloadStudentsCardBtn");
    const studentViewSection = document.getElementById("studentViewSection");
    const fetchStudentsBtn = document.getElementById("fetchStudentsBtn");
    const studentTableBody = document.getElementById("studentTableBody");
    const sDept = document.getElementById("sDept");
    const sSec = document.getElementById("sSec");
    const sYear = document.getElementById("sYear");

    // Faculty Data Elements
    const manageFacultyDataBtn = document.getElementById("manageFacultyDataBtn");
    const manageFacultySection = document.getElementById("manageFacultySection");
    const backFromManageFaculty = document.getElementById("backFromManageFaculty");
    const uploadFacultyAdminBtn = document.getElementById("uploadFacultyAdminBtn");
    const viewFacultyBtn = document.getElementById("viewFacultyBtn");
    const downloadFacultyCardBtn = document.getElementById("downloadFacultyCardBtn");
    const facultyViewSection = document.getElementById("facultyViewSection");
    const fetchFacultyBtn = document.getElementById("fetchFacultyBtn");
    const facultyTableBody = document.getElementById("facultyTableBody");
    const fDeptAdmin = document.getElementById("fDeptAdmin");
    // fSecAdmin and fYearAdmin are in HTML but entity doesn't have them. 
    // I'll keep them for UI completeness as requested.

    // ------------------ UTILITY: CREATE MODAL ------------------
    function createModal(title, contentHTML, submitCallback, options = {}) {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";

        const modal = document.createElement("div");
        modal.className = "modal-content";
        if (options.maxWidth) modal.style.maxWidth = options.maxWidth;

        modal.innerHTML = `<h3>${title}</h3>
                           <div class="modal-body-scroll">${contentHTML}</div>
                           <div class="modal-message" id="modalMsg"></div>`;

        const actions = document.createElement("div");
        actions.className = "modal-actions";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "cancel-btn";
        cancelBtn.textContent = options.cancelText || "Cancel";
        cancelBtn.onclick = () => document.body.removeChild(overlay);

        const submitBtn = document.createElement("button");
        submitBtn.className = "submit-btn";
        submitBtn.textContent = options.submitText || "Submit";
        submitBtn.onclick = () => submitCallback(modal, overlay);

        actions.appendChild(cancelBtn);
        actions.appendChild(submitBtn);
        modal.appendChild(actions);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        return modal;
    }

    function showMsg(modal, text, type = "success") {
        const msg = modal.querySelector("#modalMsg");
        if (!msg) return;
        msg.textContent = text;
        msg.className = `modal-message active ${type}`;
    }

    // ------------------ NAVIGATION: STUDENTS ------------------
    manageStudentDataBtn?.addEventListener("click", () => {
        adminDashboard.classList.add("hidden");
        manageStudentSection.classList.remove("hidden");
        loadDepartmentsForFilters();
    });

    backFromManageStudents?.addEventListener("click", () => {
        manageStudentSection.classList.add("hidden");
        adminDashboard.classList.remove("hidden");
        studentViewSection.classList.add("hidden");
    });

    // ------------------ NAVIGATION: FACULTY ------------------
    manageFacultyDataBtn?.addEventListener("click", () => {
        adminDashboard.classList.add("hidden");
        manageFacultySection.classList.remove("hidden");
        loadDepartmentsForFilters();
    });

    backFromManageFaculty?.addEventListener("click", () => {
        manageFacultySection.classList.add("hidden");
        adminDashboard.classList.remove("hidden");
        facultyViewSection.classList.add("hidden");
    });

    // ------------------ MANAGE DEPARTMENTS ------------------
    manageDeptBtn?.addEventListener("click", () => {
        const modal = createModal("Manage Departments", `
            <div class="input-group">
                <input type="text" id="newDeptName" placeholder="New Department Name" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;">
            </div>
            <div id="deptTableContainer" style="max-height:300px; overflow-y:auto;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead><tr style="border-bottom:2px solid #eee;"><th style="text-align:left; padding:10px;">Name</th><th style="padding:10px;">Action</th></tr></thead>
                    <tbody id="deptListBody"></tbody>
                </table>
            </div>
        `, (m, o) => {
            const name = m.querySelector("#newDeptName").value.trim();
            if (!name) return showMsg(m, "Enter a name", "error");
            authFetch(`/departments/add?name=${encodeURIComponent(name)}`, { method: "POST" }).then(r => {
                if (r.ok) { showMsg(m, "Added!"); loadDeptsInModal(m); m.querySelector("#newDeptName").value = ""; }
                else showMsg(m, "Failed to add", "error");
            });
        }, { submitText: "Add Department", maxWidth: "500px" });

        loadDeptsInModal(modal);
    });

    async function loadDeptsInModal(modal) {
        const body = modal.querySelector("#deptListBody");
        if (!body) return;
        body.innerHTML = "<tr><td colspan='2'>Loading...</td></tr>";
        const res = await authFetch("/departments");
        const depts = await res.json();
        body.innerHTML = depts.map(d => `
            <tr style="border-bottom:1px solid #f9f9f9;">
                <td style="padding:10px;">${d.name}</td>
                <td style="text-align:center;"><button class="small-delete-btn" data-id="${d.id}" style="padding:5px 10px; cursor:pointer; background:#fee2e2; color:#ef4444; border:none; border-radius:4px;">Delete</button></td>
            </tr>
        `).join("");
        body.querySelectorAll(".small-delete-btn").forEach(btn => {
            btn.onclick = async () => {
                if (confirm("Delete department?")) {
                    await authFetch(`/departments/delete/${btn.dataset.id}`, { method: "DELETE" });
                    loadDeptsInModal(modal);
                }
            };
        });
    }

    // ------------------ MANAGE STUDENTS (CRUD) ------------------
    uploadStudentAdminBtn?.addEventListener("click", () => {
        createModal("Bulk Upload Students",
            `<p style="color:#64748b; margin-bottom:15px;">Please select an Excel (.xlsx) file containing student details.</p>
           <input type="file" id="studentExcel" accept=".xlsx, .xls">`,
            (modal, overlay) => {
                const file = modal.querySelector("#studentExcel").files[0];
                if (!file) return showMsg(modal, "Please select a file first.", "error");
                const fd = new FormData(); fd.append("file", file);
                authFetch("/upload/students", { method: "POST", body: fd }).then(async r => {
                    if (r.ok) { showMsg(modal, "Uploaded successfully!"); setTimeout(() => overlay.remove(), 1500); }
                    else showMsg(modal, await r.text(), "error");
                });
            }, { submitText: "Upload" });
    });

    viewStudentsBtn?.addEventListener("click", () => studentViewSection.classList.toggle("hidden"));

    fetchStudentsBtn?.addEventListener("click", () => {
        let url = `/admin/students?department=${encodeURIComponent(sDept.value)}&section=${encodeURIComponent(sSec.value)}&year=${sYear.value}`;
        studentTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:50px;">Loading...</td></tr>';
        authFetch(url).then(r => r.json()).then(data => {
            if (!data.length) studentTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:50px;">No records.</td></tr>';
            else renderStudentsTable(data);
        });
    });

    function renderStudentsTable(students) {
        studentTableBody.innerHTML = students.map(s => `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:15px 20px;">${s.studentRollNumber}</td>
                <td style="padding:15px 20px; font-weight:600;">${s.studentName}</td>
                <td style="padding:15px 20px; color:var(--text-muted);">${s.studentEmail}</td>
                <td style="padding:15px 20px;">${s.department}</td>
                <td style="padding:15px 20px;">${s.studentSection}</td>
                <td style="padding:15px 20px;">${s.studentYear}</td>
                <td style="padding:15px 20px; display:flex; gap:10px;">
                    <button class="edit-student-btn btn-premium" data-roll="${s.studentRollNumber}" style="background:#6366f1; color:white; padding:5px 12px; font-size:12px;">Edit</button>
                    <button class="delete-student-btn btn-premium" data-roll="${s.studentRollNumber}" style="background:#ef4444; color:white; padding:5px 12px; font-size:12px;">Delete</button>
                </td>
            </tr>
        `).join("");
        studentTableBody.querySelectorAll(".edit-student-btn").forEach(btn => btn.onclick = () => editStudent(students.find(s => s.studentRollNumber === btn.dataset.roll)));
        studentTableBody.querySelectorAll(".delete-student-btn").forEach(btn => btn.onclick = () => {
            if (confirm(`Delete student ${btn.dataset.roll}?`)) authFetch(`/admin/students/${btn.dataset.roll}`, { method: "DELETE" }).then(r => r.ok && fetchStudentsBtn.click());
        });
    }

    function editStudent(s) {
        createModal(`Edit Student: ${s.studentRollNumber}`, `
            <div class="input-group"><label class="input-label">Name</label><input type="text" id="eName" value="${s.studentName}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Email</label><input type="email" id="eEmail" value="${s.studentEmail}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Department</label><select id="eDept" class="dept-select-dynamic" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"><option value="${s.department}">${s.department}</option></select></div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;"><div class="input-group"><label class="input-label">Section</label><input type="text" id="eSec" value="${s.studentSection}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div><div class="input-group"><label class="input-label">Year</label><input type="number" id="eYear" value="${s.studentYear}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div></div>
            <div class="input-group"><label class="input-label">New Password</label><input type="password" id="ePass" placeholder="••••••••" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
        `, (m, o) => {
            const payload = { studentName: m.querySelector("#eName").value, studentEmail: m.querySelector("#eEmail").value, department: m.querySelector("#eDept").value, studentSection: m.querySelector("#eSec").value, studentYear: parseInt(m.querySelector("#eYear").value), password: m.querySelector("#ePass").value };
            authFetch(`/admin/students/${s.studentRollNumber}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(r => {
                if (r.ok) { showMsg(m, "Updated!"); setTimeout(() => { o.remove(); fetchStudentsBtn.click(); }, 1000); }
                else showMsg(m, "Failed", "error");
            });
        }, { submitText: "Save Changes", maxWidth: "450px" });
        loadDepartmentsForFilters();
    }

    downloadStudentsCardBtn?.addEventListener("click", () => {
        authFetch(`/admin/students/download?department=${encodeURIComponent(sDept.value)}&section=${encodeURIComponent(sSec.value)}&year=${sYear.value}`).then(r => r.blob()).then(blob => {
            const u = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `Students_Export.xlsx`; a.click();
        });
    });

    // ------------------ MANAGE FACULTY (CRUD) ------------------
    uploadFacultyAdminBtn?.addEventListener("click", () => {
        createModal("Bulk Upload Faculty",
            `<p style="color:#64748b; margin-bottom:15px;">Please select an Excel (.xlsx) file containing faculty details.</p>
           <input type="file" id="facultyExcel" accept=".xlsx, .xls">`,
            (modal, overlay) => {
                const file = modal.querySelector("#facultyExcel").files[0];
                if (!file) return showMsg(modal, "Please select a file first.", "error");
                const fd = new FormData(); fd.append("file", file);
                authFetch("/upload/faculty", { method: "POST", body: fd }).then(async r => {
                    if (r.ok) { showMsg(modal, "Uploaded successfully!"); setTimeout(() => overlay.remove(), 1500); }
                    else showMsg(modal, await r.text(), "error");
                });
            }, { submitText: "Upload" });
    });

    viewFacultyBtn?.addEventListener("click", () => facultyViewSection.classList.toggle("hidden"));

    fetchFacultyBtn?.addEventListener("click", () => {
        let url = `/admin/faculty?department=${encodeURIComponent(fDeptAdmin.value)}`;
        facultyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:50px;">Loading Faculty...</td></tr>';
        authFetch(url).then(r => r.json()).then(data => {
            if (!data.length) facultyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:50px;">No faculty found.</td></tr>';
            else renderFacultyTable(data);
        });
    });

    function renderFacultyTable(faculty) {
        facultyTableBody.innerHTML = faculty.map(f => `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:15px 20px;">${f.facultyId}</td>
                <td style="padding:15px 20px; font-weight:600;">${f.facultyName}</td>
                <td style="padding:15px 20px; color:var(--text-muted);">${f.email}</td>
                <td style="padding:15px 20px;">${f.department}</td>
                <td style="padding:15px 20px; display:flex; gap:10px;">
                    <button class="edit-faculty-btn btn-premium" data-id="${f.facultyId}" style="background:#6366f1; color:white; padding:5px 12px; font-size:12px;">Edit</button>
                    <button class="delete-faculty-btn btn-premium" data-id="${f.facultyId}" style="background:#ef4444; color:white; padding:5px 12px; font-size:12px;">Delete</button>
                </td>
            </tr>
        `).join("");
        facultyTableBody.querySelectorAll(".edit-faculty-btn").forEach(btn => btn.onclick = () => editFaculty(faculty.find(f => f.facultyId === btn.dataset.id)));
        facultyTableBody.querySelectorAll(".delete-faculty-btn").forEach(btn => btn.onclick = () => {
            if (confirm(`Delete faculty ${btn.dataset.id}?`)) authFetch(`/admin/faculty/${btn.dataset.id}`, { method: "DELETE" }).then(r => r.ok && fetchFacultyBtn.click());
        });
    }

    function editFaculty(f) {
        createModal(`Edit Faculty: ${f.facultyId}`, `
            <div class="input-group"><label class="input-label">Name</label><input type="text" id="efName" value="${f.facultyName}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Email</label><input type="email" id="efEmail" value="${f.email}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Department</label><select id="efDept" class="dept-select-dynamic" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"><option value="${f.department}">${f.department}</option></select></div>
            <div class="input-group"><label class="input-label">New Password</label><input type="password" id="efPass" placeholder="••••••••" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
        `, (m, o) => {
            const payload = { facultyName: m.querySelector("#efName").value, email: m.querySelector("#efEmail").value, department: m.querySelector("#efDept").value, password: m.querySelector("#efPass").value };
            authFetch(`/admin/faculty/${f.facultyId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(r => {
                if (r.ok) { showMsg(m, "Updated!"); setTimeout(() => { o.remove(); fetchFacultyBtn.click(); }, 1000); }
                else showMsg(m, "Failed", "error");
            });
        }, { submitText: "Save Changes", maxWidth: "450px" });
        loadDepartmentsForFilters();
    }

    downloadFacultyCardBtn?.addEventListener("click", () => {
        authFetch(`/admin/faculty/download?department=${encodeURIComponent(fDeptAdmin.value)}`).then(r => r.blob()).then(blob => {
            const u = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `Faculty_Export.xlsx`; a.click();
        });
    });

    // ------------------ GLOBAL UTILS ------------------
    async function loadDepartmentsForFilters() {
        const res = await authFetch("/departments");
        const depts = await res.json();
        const html = '<option value="">All Departments</option>' + depts.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
        document.querySelectorAll(".dept-select-dynamic").forEach(s => {
            const curVal = s.value;
            s.innerHTML = html;
            if (curVal) s.value = curVal;
        });
    }

})();
