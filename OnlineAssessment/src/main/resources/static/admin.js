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
    const sRollSearch = document.getElementById("sRollSearch");
    const studentAddMainBtn = document.getElementById("studentAddMainBtn");

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
    const fIdSearch = document.getElementById("fIdSearch");
    const facultyAddMainBtn = document.getElementById("facultyAddMainBtn");
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
        openDeptManager();
    });

    function openDeptManager() {
        const modal = createModal("Manage Departments", `
            <div id="deptEditor" style="background:#f8fafc; padding:20px; border-radius:15px; border:1px solid #e2e8f0; margin-bottom:25px;">
                <h4 id="editorTitle" style="margin:0 0 15px; color:var(--primary);">Add New Department</h4>
                <div class="input-group" style="margin-bottom:15px;">
                    <label class="input-label">Department Name</label>
                    <input type="text" id="deptNameInput" placeholder="e.g. Computer Science" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:10px;">
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h5 style="margin:0; color:#64748b;">Years & Sections</h5>
                    <button id="addYearBtn" class="premium-btn" style="background:var(--primary); color:white; border:none; padding:5px 15px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:700;">+ Add Year</button>
                </div>
                
                <div id="yearRows" style="max-height:200px; overflow-y:auto; display:grid; gap:10px; padding:5px;"></div>
                
                <div style="margin-top:15px; display:flex; gap:10px; justify-content: flex-end;">
                    <button id="cancelEditBtn" class="premium-btn hidden" style="background:#64748b; color:white; border:none; padding:8px 15px; border-radius:10px; font-size:12px;">Cancel Edit</button>
                </div>
            </div>

            <div id="deptTableContainer" style="max-height:300px; overflow-y:auto; border:1px solid #eee; border-radius:15px; padding:10px; background:white;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:2px solid #eee; font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">
                            <th style="text-align:left; padding:12px;">Department</th>
                            <th style="text-align:center; padding:12px;">Yrs</th>
                            <th style="text-align:left; padding:12px;">Sections Breakdown</th>
                            <th style="text-align:right; padding:12px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="deptListBody"></tbody>
                </table>
            </div>
        `, async (m, o) => {
            const name = m.querySelector("#deptNameInput").value.trim();
            if (!name) { showAlert("Enter department name"); return; }

            const rows = m.querySelectorAll(".year-config-row");
            if (rows.length === 0) { showAlert("Add at least one year"); return; }

            const sectionsMap = {};
            rows.forEach((row, idx) => {
                const sections = row.querySelector(".sec-input").value.trim().split(/\s+/).filter(s => s);
                sectionsMap[idx + 1] = sections;
            });

            const payload = {
                name: name,
                years: rows.length,
                sections: JSON.stringify(sectionsMap)
            };

            const url = editingId ? `/departments/update/${editingId}` : '/departments/add';
            const method = editingId ? 'PUT' : 'POST';
            const params = new URLSearchParams(payload).toString();

            const res = await authFetch(`${url}?${params}`, { method: method });
            if (res.ok) {
                showAlert(editingId ? "Updated Successfully!" : "Added Successfully!", "Success", "✅");
                resetEditor();
                loadDeptsInManager(m, (dept) => editDept(dept));
            } else {
                showAlert("Save failed");
            }
        }, { submitText: "Save Changes", maxWidth: "700px", closeOnSubmit: false });

        const yearRows = modal.querySelector("#yearRows");
        const addYearBtn = modal.querySelector("#addYearBtn");
        const cancelEditBtn = modal.querySelector("#cancelEditBtn");
        const nameInput = modal.querySelector("#deptNameInput");
        const editorTitle = modal.querySelector("#editorTitle");

        let editingId = null;

        const createYearRow = (yearNum, sections = []) => {
            const row = document.createElement("div");
            row.className = "year-config-row";
            row.dataset.year = yearNum;
            row.style = "display:grid; grid-template-columns: 80px 1fr 40px; align-items:center; gap:10px; background:white; padding:10px; border-radius:10px; border:1px solid #e2e8f0;";
            row.innerHTML = `
                <span style="font-weight:800; color:#1e293b; font-size:13px;">Year ${yearNum}:</span>
                <input type="text" class="sec-input" value="${sections.join(" ")}" placeholder="Sections (A B C)" style="padding:8px 12px; border:1px solid #ddd; border-radius:8px; font-size:13px;">
                <button class="remove-year-btn" style="background:none; border:none; color:#f43f5e; cursor:pointer; font-size:18px;">&times;</button>
            `;
            row.querySelector(".remove-year-btn").onclick = () => row.remove();
            yearRows.appendChild(row);
        };

        addYearBtn.onclick = () => {
            const currentYears = yearRows.querySelectorAll(".year-config-row").length;
            createYearRow(currentYears + 1);
        };

        const resetEditor = () => {
            editingId = null;
            nameInput.value = "";
            yearRows.innerHTML = "";
            editorTitle.textContent = "Add New Department";
            cancelEditBtn.classList.add("hidden");
        };

        const editDept = (dept) => {
            editingId = dept.id;
            nameInput.value = dept.name;
            yearRows.innerHTML = "";
            editorTitle.textContent = `Editing: ${dept.name}`;
            cancelEditBtn.classList.remove("hidden");

            try {
                const map = typeof dept.sections === 'string' ? JSON.parse(dept.sections) : dept.sections;
                Object.keys(map).sort((a, b) => a - b).forEach(yr => {
                    createYearRow(yr, map[yr]);
                });
            } catch (e) { console.error(e); }
        };

        cancelEditBtn.onclick = resetEditor;

        loadDeptsInManager(modal, (dept) => editDept(dept));
    }

    async function loadDeptsInManager(modal, onEdit) {
        const body = modal.querySelector("#deptListBody");
        if (!body) return;
        body.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:30px; color:#64748b;'>Loading departments...</td></tr>";

        const res = await authFetch("/departments");
        const depts = await res.json();

        if (depts.length === 0) {
            body.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:30px; color:#64748b;'>No departments found.</td></tr>";
            return;
        }

        body.innerHTML = depts.map(d => {
            let sectionsBrief = "N/A";
            try {
                const map = typeof d.sections === 'string' ? JSON.parse(d.sections) : (d.sections || {});
                sectionsBrief = Object.keys(map).sort((a, b) => a - b)
                    .map(yr => `<span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:10px; margin-right:4px; white-space:nowrap;"><b>Y${yr}:</b> ${map[yr].join(", ")}</span>`)
                    .join(" ");
            } catch (e) { }

            return `
                <tr style="border-bottom:1px solid #f1f5f9; transition:0.2s;">
                    <td style="padding:15px 12px; font-weight:700; color:#1e293b;">${d.name}</td>
                    <td style="padding:15px 12px; text-align:center; font-weight:800; color:var(--primary);">${d.years}</td>
                    <td style="padding:15px 12px; font-size:11px; color:#64748b;">${sectionsBrief}</td>
                    <td style="padding:15px 12px; text-align:right; display:flex; gap:10px; justify-content:flex-end;">
                        <button class="edit-btn" data-id="${d.id}" style="padding:6px 15px; border-radius:8px; border:1px solid #6366f1; background:white; color:#6366f1; font-weight:700; cursor:pointer;">Edit</button>
                        <button class="del-btn" data-id="${d.id}" style="padding:6px 15px; border-radius:8px; border:none; background:#fee2e2; color:#ef4444; font-weight:700; cursor:pointer;">Delete</button>
                    </td>
                </tr>
            `;
        }).join("");

        body.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = () => onEdit(depts.find(x => x.id == btn.dataset.id));
        });

        body.querySelectorAll(".del-btn").forEach(btn => {
            btn.onclick = async () => {
                const confirmed = await showConfirm(`Permanent Delete Department?`);
                if (confirmed) {
                    await authFetch(`/departments/delete/${btn.dataset.id}`, { method: "DELETE" });
                    loadDeptsInManager(modal, onEdit);
                    showAlert("Department Deleted", "Success", "🗑️");
                }
            };
        });
    }

    // ------------------ MANAGE STUDENTS (CRUD) ------------------
    studentAddMainBtn?.addEventListener("click", () => {
        createModal("Add Student Data", `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; padding:20px 0;">
                <div class="role-card" id="choiceIndividualStudent" style="border:2px solid #e2e8f0; cursor:pointer;">
                    <div class="icon">👤</div>
                    <h4>Individual Data</h4>
                    <p style="font-size:12px;">Add one student at a time.</p>
                </div>
                <div class="role-card" id="choiceBulkStudent" style="border:2px solid #e2e8f0; cursor:pointer;">
                    <div class="icon">📤</div>
                    <h4>Bulk Data</h4>
                    <p style="font-size:12px;">Upload Excel file.</p>
                </div>
            </div>
        `, null, { cancelText: "Close", submitText: "Select Option" }); // submitBtn will be hidden or not used

        const overlay = document.querySelector(".modal-overlay");
        const modal = overlay.querySelector(".modal-content");
        modal.querySelector(".modal-actions .submit-btn").style.display = "none";

        modal.querySelector("#choiceIndividualStudent").onclick = () => {
            overlay.remove();
            openIndividualStudentModal();
        };
        modal.querySelector("#choiceBulkStudent").onclick = () => {
            overlay.remove();
            openBulkStudentModal();
        };
    });

    function openBulkStudentModal() {
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
    }

    function openIndividualStudentModal() {
        createModal("Add Individual Student", `
            <div class="input-group"><label class="input-label">Roll Number</label><input type="text" id="addSRoll" placeholder="Roll Number" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Name</label><input type="text" id="addSName" placeholder="Full Name" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Email</label><input type="email" id="addSEmail" placeholder="Email Address" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Department</label><select id="addSDept" class="dept-select-dynamic" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></select></div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div class="input-group"><label class="input-label">Section</label><select id="addSSec" class="section-select-dynamic" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"><option value="">Select Section</option></select></div>
                <div class="input-group"><label class="input-label">Year</label><select id="addSYear" class="year-select-dynamic" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"><option value="">Select Year</option></select></div>
            </div>
            <p style="font-size:12px; color:#64748b; margin-top:10px;">* Default password: <b>Reset@2025</b></p>
        `, (m, o) => {
            const payload = {
                studentRollNumber: m.querySelector("#addSRoll").value,
                studentName: m.querySelector("#addSName").value,
                studentEmail: m.querySelector("#addSEmail").value,
                department: m.querySelector("#addSDept").value,
                studentSection: m.querySelector("#addSSec").value,
                studentYear: parseInt(m.querySelector("#addSYear").value),
                password: "Reset@2025" // Fixed default password
            };
            if (!payload.studentRollNumber) return showMsg(m, "Roll Number is required", "error");

            authFetch(`/admin/students/add`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(r => {
                if (r.ok) { showMsg(m, "Student Added!"); setTimeout(() => o.remove(), 1000); }
                else r.text().then(t => showMsg(m, t || "Failed", "error"));
            });
        }, { submitText: "Add Student", maxWidth: "450px" });
        loadDepartmentsForFilters();
    }

    viewStudentsBtn?.addEventListener("click", () => {
        const isHidden = studentViewSection.classList.toggle("hidden");
        if (!isHidden) {
            setTimeout(() => {
                studentViewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        }
    });

    fetchStudentsBtn?.addEventListener("click", () => {
        let url = `/admin/students?department=${encodeURIComponent(sDept.value)}&section=${encodeURIComponent(sSec.value)}&year=${sYear.value}&rollNumber=${encodeURIComponent(sRollSearch.value)}`;
        studentTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:50px;">Loading...</td></tr>';
        authFetch(url).then(r => r.json()).then(data => {
            if (!data.length) studentTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:50px;">No records.</td></tr>';
            else {
                renderStudentsTable(data);
                setTimeout(() => {
                    studentTableBody.closest('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
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
        studentTableBody.querySelectorAll(".delete-student-btn").forEach(btn => btn.onclick = async () => {
            const confirmed = await showConfirm(`Delete student ${btn.dataset.roll}?`);
            if (confirmed) {
                const r = await authFetch(`/admin/students/${btn.dataset.roll}`, { method: "DELETE" });
                if (r.ok) {
                    fetchStudentsBtn.click();
                    showAlert("Student Deleted", "Success", "🗑️");
                }
            }
        });
    }

    function editStudent(s) {
        createModal(`Edit Student: ${s.studentRollNumber}`, `
            <div class="input-group"><label class="input-label">Name</label><input type="text" id="eName" value="${s.studentName}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Email</label><input type="email" id="eEmail" value="${s.studentEmail}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Department</label><select id="eDept" class="dept-select-dynamic" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"><option value="${s.department}">${s.department}</option></select></div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div class="input-group"><label class="input-label">Section</label><select id="eSec" class="section-select-dynamic" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"><option value="${s.studentSection}">${s.studentSection}</option></select></div>
                <div class="input-group"><label class="input-label">Year</label><select id="eYear" class="year-select-dynamic" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"><option value="${s.studentYear}">${s.studentYear}</option></select></div>
            </div>
        `, (m, o) => {
            const payload = { studentName: m.querySelector("#eName").value, studentEmail: m.querySelector("#eEmail").value, department: m.querySelector("#eDept").value, studentSection: m.querySelector("#eSec").value, studentYear: parseInt(m.querySelector("#eYear").value) };
            authFetch(`/admin/students/${s.studentRollNumber}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(r => {
                if (r.ok) { showMsg(m, "Updated!"); setTimeout(() => { o.remove(); fetchStudentsBtn.click(); }, 1000); }
                else showMsg(m, "Failed", "error");
            });
        }, { submitText: "Save Changes", maxWidth: "450px" });
        loadDepartmentsForFilters();
    }

    downloadStudentsCardBtn?.addEventListener("click", () => {
        authFetch(`/admin/students/download?department=${encodeURIComponent(sDept.value)}&section=${encodeURIComponent(sSec.value)}&year=${sYear.value}&rollNumber=${encodeURIComponent(sRollSearch.value)}`).then(r => r.blob()).then(blob => {
            const u = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `Students_Export.xlsx`; a.click();
        });
    });

    // ------------------ MANAGE FACULTY (CRUD) ------------------
    facultyAddMainBtn?.addEventListener("click", () => {
        createModal("Add Faculty Data", `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; padding:20px 0;">
                <div class="role-card" id="choiceIndividualFaculty" style="border:2px solid #e2e8f0; cursor:pointer;">
                    <div class="icon">👤</div>
                    <h4>Individual Data</h4>
                    <p style="font-size:12px;">Add one faculty at a time.</p>
                </div>
                <div class="role-card" id="choiceBulkFaculty" style="border:2px solid #e2e8f0; cursor:pointer;">
                    <div class="icon">📤</div>
                    <h4>Bulk Data</h4>
                    <p style="font-size:12px;">Upload Excel file.</p>
                </div>
            </div>
        `, null, { cancelText: "Close", submitText: "Select Option" });

        const overlay = document.querySelector(".modal-overlay");
        const modal = overlay.querySelector(".modal-content");
        modal.querySelector(".modal-actions .submit-btn").style.display = "none";

        modal.querySelector("#choiceIndividualFaculty").onclick = () => {
            overlay.remove();
            openIndividualFacultyModal();
        };
        modal.querySelector("#choiceBulkFaculty").onclick = () => {
            overlay.remove();
            openBulkFacultyModal();
        };
    });

    function openBulkFacultyModal() {
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
    }

    function openIndividualFacultyModal() {
        createModal("Add Individual Faculty", `
            <div class="input-group"><label class="input-label">Faculty ID</label><input type="text" id="addFId" placeholder="Faculty ID" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Name</label><input type="text" id="addFName" placeholder="Full Name" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Email</label><input type="email" id="addFEmail" placeholder="Email Address" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Department</label><select id="addFDept" class="dept-select-dynamic" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></select></div>
            <p style="font-size:12px; color:#64748b; margin-top:10px;">* Default password: <b>Faculty ID</b></p>
        `, (m, o) => {
            const facultyId = m.querySelector("#addFId").value;
            const payload = {
                facultyId: facultyId,
                facultyName: m.querySelector("#addFName").value,
                email: m.querySelector("#addFEmail").value,
                department: m.querySelector("#addFDept").value,
                password: facultyId // Password defaults to Faculty ID
            };
            if (!payload.facultyId) return showMsg(m, "Faculty ID is required", "error");

            authFetch(`/admin/faculty/add`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(r => {
                if (r.ok) { showMsg(m, "Faculty Added!"); setTimeout(() => o.remove(), 1000); }
                else r.text().then(t => showMsg(m, t || "Failed", "error"));
            });
        }, { submitText: "Add Faculty", maxWidth: "450px" });
        loadDepartmentsForFilters();
    }

    viewFacultyBtn?.addEventListener("click", () => {
        const isHidden = facultyViewSection.classList.toggle("hidden");
        if (!isHidden) {
            setTimeout(() => {
                facultyViewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        }
    });

    fetchFacultyBtn?.addEventListener("click", () => {
        let url = `/admin/faculty?department=${encodeURIComponent(fDeptAdmin.value)}&facultyId=${encodeURIComponent(fIdSearch.value)}`;
        facultyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:50px;">Loading Faculty...</td></tr>';
        authFetch(url).then(r => r.json()).then(data => {
            if (!data.length) facultyTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:50px;">No faculty found.</td></tr>';
            else {
                renderFacultyTable(data);
                setTimeout(() => {
                    facultyTableBody.closest('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
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
        facultyTableBody.querySelectorAll(".delete-faculty-btn").forEach(btn => btn.onclick = async () => {
            const confirmed = await showConfirm(`Delete faculty ${btn.dataset.id}?`);
            if (confirmed) {
                const r = await authFetch(`/admin/faculty/${btn.dataset.id}`, { method: "DELETE" });
                if (r.ok) {
                    fetchFacultyBtn.click();
                    showAlert("Faculty Deleted", "Success", "🗑️");
                }
            }
        });
    }

    function editFaculty(f) {
        createModal(`Edit Faculty: ${f.facultyId}`, `
            <div class="input-group"><label class="input-label">Name</label><input type="text" id="efName" value="${f.facultyName}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Email</label><input type="email" id="efEmail" value="${f.email}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"></div>
            <div class="input-group"><label class="input-label">Department</label><select id="efDept" class="dept-select-dynamic" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;"><option value="${f.department}">${f.department}</option></select></div>
        `, (m, o) => {
            const payload = { facultyName: m.querySelector("#efName").value, email: m.querySelector("#efEmail").value, department: m.querySelector("#efDept").value };
            authFetch(`/admin/faculty/${f.facultyId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(r => {
                if (r.ok) { showMsg(m, "Updated!"); setTimeout(() => { o.remove(); fetchFacultyBtn.click(); }, 1000); }
                else showMsg(m, "Failed", "error");
            });
        }, { submitText: "Save Changes", maxWidth: "450px" });
        loadDepartmentsForFilters();
    }

    downloadFacultyCardBtn?.addEventListener("click", () => {
        authFetch(`/admin/faculty/download?department=${encodeURIComponent(fDeptAdmin.value)}&facultyId=${encodeURIComponent(fIdSearch.value)}`).then(r => r.blob()).then(blob => {
            const u = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `Faculty_Export.xlsx`; a.click();
        });
    });

    // ------------------ GLOBAL UTILS ------------------
    let globalDepts = [];

    async function loadDepartmentsForFilters() {
        if (globalDepts.length === 0) {
            try {
                const res = await authFetch("/departments");
                if (!res.ok) throw new Error("Failed to fetch departments");
                globalDepts = await res.json();
            } catch (err) {
                console.error(err);
                return;
            }
        }

        const selects = document.querySelectorAll(".dept-select-dynamic");
        selects.forEach(s => {
            const isFilter = s.id === "sDept" || s.id === "fDeptAdmin";
            const currentVal = s.value;

            // Re-populate if empty or contains only dummy options
            if (s.children.length <= 1) {
                let html = isFilter ? '<option value="">All Departments</option>' : '<option value="">Select Department</option>';
                html += globalDepts.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
                s.innerHTML = html;
                if (currentVal) s.value = currentVal;
            }

            if (!s.dataset.listenerAttached) {
                s.addEventListener("change", () => {
                    const container = s.closest('.filter-panel') || s.closest('.modal-body-scroll') || s.parentElement.parentElement;
                    const dept = globalDepts.find(d => d.name === s.value);
                    if (dept) {
                        updateYearAndSectionSelectors(dept, container, true, isFilter);
                    } else {
                        const yearSelect = container.querySelector(".year-select-dynamic");
                        const secSelect = container.querySelector(".section-select-dynamic");
                        if (yearSelect) yearSelect.innerHTML = isFilter ? '<option value="">All Years</option>' : '<option value="">Select Year</option>';
                        if (secSelect) secSelect.innerHTML = isFilter ? '<option value="">All Sections</option>' : '<option value="">Select Section</option>';
                    }
                });
                s.dataset.listenerAttached = "true";
            }

            // Bind Year Listener independent of Dept loop to avoid closure issues
            const container = s.closest('.filter-panel') || s.closest('.modal-body-scroll') || s.parentElement.parentElement;
            const yearSelect = container ? container.querySelector(".year-select-dynamic") : null;

            if (yearSelect && !yearSelect.dataset.listenerAttached) {
                yearSelect.addEventListener("change", (e) => {
                    const currentContainer = e.target.closest('.filter-panel') || e.target.closest('.modal-body-scroll') || e.target.closest('.dashboard-cards') || e.target.parentElement.parentElement.parentElement;
                    const deptSelect = currentContainer.querySelector(".dept-select-dynamic");

                    if (deptSelect && deptSelect.value) {
                        const dept = globalDepts.find(d => d.name === deptSelect.value);
                        if (dept) {
                            // Pass false to NOT update years (prevents reset)
                            updateYearAndSectionSelectors(dept, currentContainer, false, isFilter);
                        }
                    }
                });
                yearSelect.dataset.listenerAttached = "true";
            }

            // Initial population
            if (s.value) {
                const dept = globalDepts.find(d => d.name === s.value);
                if (dept && container) updateYearAndSectionSelectors(dept, container, true, isFilter);
            }
        });
    }

    function updateYearAndSectionSelectors(dept, container, updateYears = true, isFilter = false) {
        if (!container || !dept) return;
        const yearSelect = container.querySelector(".year-select-dynamic");
        const secSelect = container.querySelector(".section-select-dynamic");

        // Update Years ONLY if requested (e.g. Dept changed)
        if (updateYears && yearSelect) {
            const currentYear = yearSelect.value;
            let yearHtml = isFilter ? '<option value="">All Years</option>' : '<option value="">Select Year</option>';
            if (dept.years > 0) {
                for (let i = 1; i <= dept.years; i++) {
                    yearHtml += `<option value="${i}">Year ${i}</option>`;
                }
            }
            yearSelect.innerHTML = yearHtml;
            // Try to preserve value if it still exists
            if (currentYear && yearSelect.querySelector(`option[value="${currentYear}"]`)) {
                yearSelect.value = currentYear;
            }
        }

        // Always update Sections based on current Year selection
        if (secSelect) {
            const currentSec = secSelect.value;
            const year = yearSelect ? yearSelect.value : "";

            let secHtml = isFilter ? '<option value="">All Sections</option>' : '<option value="">Select Section</option>';

            if (year) {
                try {
                    const sectionsMap = typeof dept.sections === 'string' ? JSON.parse(dept.sections) : (dept.sections || {});
                    const yearKey = String(year);
                    const yearSections = sectionsMap[yearKey] || sectionsMap[year] || [];

                    if (Array.isArray(yearSections)) {
                        yearSections.forEach(sec => {
                            secHtml += `<option value="${sec}">${sec}</option>`;
                        });
                    }
                } catch (e) {
                    console.error("Sections parsing error", e);
                }
            }
            secSelect.innerHTML = secHtml;
            // Try to preserve value if it still exists
            if (currentSec && secSelect.querySelector(`option[value="${currentSec}"]`)) {
                secSelect.value = currentSec;
            }
        }
    }


})();

