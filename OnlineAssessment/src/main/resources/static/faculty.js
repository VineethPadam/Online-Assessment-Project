(() => {
  // ===== Faculty Dashboard Elements =====
  const facultyDashboard = document.getElementById("facultyDashboard");
  const uploadStudentBtn = document.getElementById("uploadStudentBtn");
  const addQuizBtn = document.getElementById("addQuizBtn");
  const activateQuizBtn = document.getElementById("activateQuizBtn");
  const viewClassResultsBtn = document.getElementById("viewClassResultsBtn");
  const facultyLogout = document.getElementById("facultyLogout");

  // Container for dynamically injected sections
  const facultyContainer = facultyDashboard.parentElement;

  // ===== Utility: Create Modal =====
  function createModal(title, contentHTML, submitCallback) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal-content";
    modal.innerHTML = `<h3>${title}</h3>${contentHTML}
                       <div class="modal-message" id="modalMsg"></div>`;

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Submit";
    submitBtn.onclick = () => submitCallback(modal, overlay);

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.onclick = () => document.body.removeChild(overlay);

    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // ===== Utility: Show Message inside Modal =====
  function showModalMessage(modal, text, type = "info") {
    const msgBox = modal.querySelector("#modalMsg");
    msgBox.textContent = text;
    msgBox.className = "modal-message " + type;
  }

  // ===== Upload Student Excel =====
  uploadStudentBtn.addEventListener("click", () => {
    createModal(
      "Upload Student Excel",
      `<input type="file" id="studentExcelFile" accept=".xlsx,.xls">`,
      (modal, overlay) => {
        const fileInput = modal.querySelector("#studentExcelFile");
        if (!fileInput.files[0]) {
          showModalMessage(modal, "Please select a file!", "error");
          return;
        }
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        fetch("/upload/students", { method: "POST", body: formData })
          .then(res => res.text())
          .then(data => {
            showModalMessage(modal, data, "success");
            setTimeout(() => document.body.removeChild(overlay), 2000);
          })
          .catch(err => showModalMessage(modal, "Error: " + err, "error"));
      }
    );
  });

  // ===== Add Quiz =====
  addQuizBtn.addEventListener("click", () => {
    createModal(
      "Add Quiz - Step 1",
      `<p>Enter quiz details:</p>
       <input type="text" id="quizName" placeholder="Quiz Name">
       <input type="text" id="quizId" placeholder="Quiz ID">`,
      (modal, overlay) => {
        const quizName = modal.querySelector("#quizName").value.trim();
        const quizId = modal.querySelector("#quizId").value.trim();
        if (!quizName || !quizId) {
          showModalMessage(modal, "Please enter all details", "error");
          return;
        }
        document.body.removeChild(overlay);

        // Step 2 - Upload Questions
        createModal(
          `Upload Questions Excel for ${quizName}`,
          `<input type="file" id="quizExcelFile" accept=".xlsx,.xls">`,
          (modal2, overlay2) => {
            const fileInput = modal2.querySelector("#quizExcelFile");
            if (!fileInput.files[0]) {
              showModalMessage(modal2, "Please select a file!", "error");
              return;
            }
            const formData = new FormData();
            formData.append("file", fileInput.files[0]);
            formData.append("quizName", quizName);
            formData.append("quizId", quizId);

            fetch("/upload/questions", { method: "POST", body: formData })
              .then(res => res.text())
              .then(data => {
                showModalMessage(modal2, data, "success");
                setTimeout(() => document.body.removeChild(overlay2), 2000);
              })
              .catch(err => showModalMessage(modal2, "Error: " + err, "error"));
          }
        );
      }
    );
  });

  // ===== Activate / Deactivate Quiz =====
  activateQuizBtn.addEventListener("click", () => {
    createModal(
      "Activate / Deactivate Quiz",
      `<input type="text" id="actQuizId" placeholder="Quiz ID">

       <select id="actSection">
         <option value="">Select Section</option>
         <option value="A">A</option>
         <option value="B">B</option>
         <option value="C">C</option>
         <option value="D">D</option>
		 <option value="E">E</option>
		 <option value="F">F</option>
		 <option value="G">G</option>
		 <option value="H">H</option>
		 <option value="I">I</option>
		 <option value="J">J</option>
       </select>

       <select id="actDepartment">
         <option value="">Select Department</option>
         <option value="CSE">CSE</option>
         <option value="ECE">ECE</option>
         <option value="ME">ME</option>
       </select>

       <select id="actYear">
         <option value="">Select Year</option>
         <option value="1">1</option>
         <option value="2">2</option>
         <option value="3">3</option>
         <option value="4">4</option>
       </select>

       <select id="actStatus">
         <option value="true">Activate</option>
         <option value="false">Deactivate</option>
       </select>`,
      (modal, overlay) => {
        const quizId = modal.querySelector("#actQuizId").value.trim();
        const section = modal.querySelector("#actSection").value;
        const department = modal.querySelector("#actDepartment").value;
        const year = modal.querySelector("#actYear").value;
        const active = modal.querySelector("#actStatus").value;

        if (!quizId || !section || !department || !year) {
          showModalMessage(modal, "Please select all fields", "error");
          return;
        }

        fetch(
          `/quiz/activate?quizId=${quizId}&section=${section}&department=${department}&year=${year}&active=${active}`,
          { method: "POST" }
        )
          .then(res => res.json())
          .then(() => {
            showModalMessage(modal, "Quiz updated successfully!", "success");
            setTimeout(() => document.body.removeChild(overlay), 2000);
          })
          .catch(err => showModalMessage(modal, "Error: " + err, "error"));
      }
    );
  });

  // ===== View Class Results =====
  viewClassResultsBtn.addEventListener("click", () => {
    facultyDashboard.classList.add("hidden");

    let prevSection = document.getElementById("classResultsSection");
    if (prevSection) prevSection.remove();

    const section = document.createElement("div");
    section.id = "classResultsSection";
    section.innerHTML = `
      <div class="results-filters">
        <select id="filterSection">
          <option value="">Select Section</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
		  <option value="E">E</option>
		  <option value="F">F</option>
		  <option value="G">G</option>
		  <option value="H">H</option>
		  <option value="I">I</option>
		  <option value="J">J</option>
        </select>

        <select id="filterDepartment">
          <option value="">Select Department</option>
          <option value="CSE">CSE</option>
		  <option value="CST">CST</option>
          <option value="ECE">ECE</option>
          <option value="ME">ME</option>
        </select>

        <select id="filterYear">
          <option value="">Select Year</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>

        <input type="text" id="filterQuizId" placeholder="Quiz ID">
        <button id="filterResultsBtn">View Results</button>
      </div>
      <table class="results-table" id="resultsTable">
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Quiz ID</th>
            <th>Quiz Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <button id="downloadExcelBtn">Download Excel</button>
      <button id="backToDashboard">Back</button>
    `;

    facultyContainer.appendChild(section);

    const resultsTableBody = section.querySelector("#resultsTable tbody");
    const filterBtn = section.querySelector("#filterResultsBtn");
    const downloadBtn = section.querySelector("#downloadExcelBtn");
    const backBtn = section.querySelector("#backToDashboard");

    filterBtn.addEventListener("click", () => {
      const sectionVal = section.querySelector("#filterSection").value;
      const departmentVal = section.querySelector("#filterDepartment").value;
      const yearVal = section.querySelector("#filterYear").value;
      const quizIdVal = section.querySelector("#filterQuizId").value.trim();

      fetch(
        `/results/filter?section=${sectionVal}&department=${departmentVal}&year=${yearVal}&quizId=${quizIdVal}`
      )
        .then(res => res.json())
        .then(data => {
          resultsTableBody.innerHTML = "";
          data.forEach(r => {
            resultsTableBody.innerHTML += `
              <tr>
                <td>${r.student?.studentRollNumber || ""}</td>
                <td>${r.quiz?.quizId || ""}</td>
                <td>${r.quiz?.quizName || ""}</td>
                <td>${r.score || 0}</td>
              </tr>
            `;
          });
        })
        .catch(err => alert("Error: " + err));
    });

    downloadBtn.addEventListener("click", () => {
      const sectionVal = section.querySelector("#filterSection").value;
      const departmentVal = section.querySelector("#filterDepartment").value;
      const yearVal = section.querySelector("#filterYear").value;
      const quizIdVal = section.querySelector("#filterQuizId").value.trim();

      window.location.href = `/results/download?section=${sectionVal}&department=${departmentVal}&year=${yearVal}&quizId=${quizIdVal}`;
    });

    backBtn.addEventListener("click", () => {
      section.remove();
      facultyDashboard.classList.remove("hidden");
    });
  });

  // ===== Logout =====
  facultyLogout.addEventListener("click", () => {
    location.reload();
  });
})();
