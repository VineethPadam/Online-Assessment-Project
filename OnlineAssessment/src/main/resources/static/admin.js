(function () {
    // ------------------ SELECT ELEMENTS ------------------
    const adminDashboard = document.getElementById("adminDashboard");
    const uploadFacultyBtn = adminDashboard.querySelector(".role-card:nth-child(1)");
    const downloadFacultyBtn = adminDashboard.querySelector(".role-card:nth-child(2)");

    // ------------------ CREATE BACKDROP + MODAL ------------------
    const backdrop = document.createElement("div");
    backdrop.id = "adminModalBackdrop";
    backdrop.classList.add("hidden"); // Initially hidden

    backdrop.innerHTML = `
      <div id="adminModal">
        <button id="closeModal" class="close-btn">&times;</button>
        <h3>Upload Faculty Excel</h3>
        <input type="file" id="facultyFileInput" />
        <button id="uploadFileBtn">Upload</button>
        <div id="uploadMsg"></div>
      </div>
    `;


    document.body.appendChild(backdrop);

    const modal = document.getElementById("adminModal");
    const closeModalBtn = document.getElementById("closeModal");
    const uploadFileBtn = document.getElementById("uploadFileBtn");
    const facultyFileInput = document.getElementById("facultyFileInput");
    const uploadMsg = document.getElementById("uploadMsg");

    // ------------------ OPEN MODAL ------------------
    uploadFacultyBtn.addEventListener("click", () => {
        backdrop.classList.remove("hidden");
        backdrop.classList.add("visible");
        uploadMsg.innerText = "";
        facultyFileInput.value = "";
    });

    // ------------------ CLOSE MODAL ------------------
    closeModalBtn.addEventListener("click", () => {
        backdrop.classList.remove("visible");
        backdrop.classList.add("hidden");
    });

    backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
            backdrop.classList.remove("visible");
            backdrop.classList.add("hidden");
        }
    });

    // ------------------ UPLOAD FILE ------------------
    uploadFileBtn.addEventListener("click", () => {
        const file = facultyFileInput.files[0];
        if (!file) {
            uploadMsg.innerText = "Please select a file first!";
            uploadMsg.style.color = "red";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        authFetch("/upload/faculty", {
            method: "POST",
            body: formData
        })
            .then(res => res.text())
            .then(msg => {
                uploadMsg.innerText = msg;
                uploadMsg.style.color = "green";
            })
            .catch(err => {
                uploadMsg.innerText = "Upload failed!";
                uploadMsg.style.color = "red";
                console.error(err);
            });
    });

    // ------------------ DOWNLOAD FILE ------------------
    downloadFacultyBtn.addEventListener("click", () => {
        authFetch("/upload/faculty/download")
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "faculty.xlsx";
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(err => console.error("Download failed", err));
    });

})();
(function () {
    // ------------------ SELECT ELEMENTS ------------------
    const manageDeptBtn = document.getElementById("manageDepartmentsBtn");

    // ------------------ CREATE DEPARTMENT MODAL ------------------
    const deptBackdrop = document.createElement("div");
    deptBackdrop.id = "deptModalBackdrop";
    deptBackdrop.classList.add("hidden");

    deptBackdrop.innerHTML = `
      <div id="deptModal">
        <button id="closeDeptModal" class="close-btn">&times;</button>
        <h3>Manage Departments</h3>
        <input type="text" id="newDeptName" placeholder="New Department Name" />
        <button type="button" id="addDeptBtn" style="background:#6a0dad; color:white; margin-top:10px;">Add Department</button>
        <div id="deptMsg"></div>
        <table id="deptTable">
          <thead>
            <tr>
                <th>Department Name</th>
                <th>Action</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    `;

    document.body.appendChild(deptBackdrop);

    const closeDeptModalBtn = document.getElementById("closeDeptModal");
    const addDeptBtn = document.getElementById("addDeptBtn");
    const newDeptName = document.getElementById("newDeptName");
    const deptMsg = document.getElementById("deptMsg");
    const deptTableBody = document.querySelector("#deptTable tbody");

    // ------------------ OPEN/CLOSE MODAL ------------------
    manageDeptBtn.addEventListener("click", () => {
        deptBackdrop.classList.remove("hidden");
        deptBackdrop.classList.add("visible");
        deptMsg.innerText = "";
        newDeptName.value = "";
        loadDepartments();
    });

    closeDeptModalBtn.addEventListener("click", () => {
        deptBackdrop.classList.remove("visible");
        deptBackdrop.classList.add("hidden");
    });

    deptBackdrop.addEventListener("click", (e) => {
        if (e.target === deptBackdrop) {
            deptBackdrop.classList.remove("visible");
            deptBackdrop.classList.add("hidden");
        }
    });

    // ------------------ LOAD DEPARTMENTS ------------------
    async function loadDepartments() {
        try {
            const res = await authFetch("/departments");
            const data = await res.json();
            deptTableBody.innerHTML = "";

            data.forEach(dept => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${dept.name}</td>
                    <td><button class="deleteDeptBtn" data-id="${dept.id}">Delete</button></td>
                `;
                deptTableBody.appendChild(row);
            });

            // Add delete listeners
            document.querySelectorAll(".deleteDeptBtn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.dataset.id;
                    try {
                        await authFetch(`/departments/delete/${id}`, { method: "DELETE" });
                        loadDepartments();
                    } catch (err) {
                        console.error(err);
                        deptMsg.innerText = "Failed to delete!";
                        deptMsg.style.color = "red";
                    }
                });
            });

        } catch (err) {
            console.error(err);
            deptMsg.innerText = "Failed to load departments!";
            deptMsg.style.color = "red";
        }
    }

    // ------------------ ADD DEPARTMENT ------------------
    addDeptBtn.addEventListener("click", async () => {
        const name = newDeptName.value.trim();
        if (!name) {
            deptMsg.innerText = "Enter a department name!";
            deptMsg.style.color = "red";
            return;
        }

        // Prevent double click
        addDeptBtn.disabled = true;
        addDeptBtn.textContent = "Adding...";

        try {
            await authFetch(`/departments/add?name=${encodeURIComponent(name)}`, { method: "POST" });
            deptMsg.innerText = "Department added!";
            deptMsg.style.color = "green";
            newDeptName.value = "";
            loadDepartments();
        } catch (err) {
            console.error(err);
            deptMsg.innerText = "Failed to add department!";
            deptMsg.style.color = "red";
        } finally {
            addDeptBtn.disabled = false;
            addDeptBtn.textContent = "Add Department";
        }
    });

})();

