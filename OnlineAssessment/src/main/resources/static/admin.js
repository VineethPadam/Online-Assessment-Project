(function() {
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
