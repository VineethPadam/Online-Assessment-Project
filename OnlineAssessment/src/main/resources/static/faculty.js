(() => {
  // ===== Faculty Dashboard Elements =====
  const facultyDashboard = document.getElementById("facultyDashboard");
  const uploadStudentBtn = document.getElementById("uploadStudentBtn");
  const addQuizBtn = document.getElementById("addQuizBtn");
  const activateQuizBtn = document.getElementById("activateQuizBtn");
  const viewClassResultsBtn = document.getElementById("viewClassResultsBtn");
  const publishResultBtn = document.getElementById("publishResultBtn");
  const facultyLogout = document.getElementById("facultyLogout");

  const facultyContainer = facultyDashboard.parentElement;

  let departmentsList = [];

  // Load all departments from backend
  async function loadDepartments() {
      try {
          const res = await authFetch("/departments");
          if (res.ok) {
              const depts = await res.json();
              // Build <option> HTML for all departments
              departmentsList = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
          } else {
              departmentsList = '<option value="">Failed to load departments</option>';
          }
      } catch (err) {
          console.error("Failed to load departments:", err);
          departmentsList = '<option value="">Failed to load departments</option>';
      }
  }

  // Wait until token is available, then load departments
  function waitForTokenAndLoadDepartments() {
      const token = sessionStorage.getItem("token");
      if (token) {
          loadDepartments(); // now token exists
      } else {
          // retry after short delay
          setTimeout(waitForTokenAndLoadDepartments, 50);
      }
  }

  // Start the process
  waitForTokenAndLoadDepartments();


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
        if (!fileInput.files[0]) return showModalMessage(modal, "Please select a file!", "error");
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);

        authFetch("/upload/students", { method: "POST", body: formData })
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
        if (!quizName || !quizId) return showModalMessage(modal, "Please enter all details", "error");

        authFetch(`/quiz/create?quizId=${quizId}&quizName=${encodeURIComponent(quizName)}`, { method: "POST" })
          .then(async res => {
            if (!res.ok) {
              const msg = await res.text();
              return showModalMessage(modal, msg, "error");
            }
            document.body.removeChild(overlay);
            createModal(
              `Upload Questions Excel for ${quizName}`,
              `<input type="file" id="quizExcelFile" accept=".xlsx,.xls">`,
              (modal2, overlay2) => {
                const fileInput = modal2.querySelector("#quizExcelFile");
                if (!fileInput.files[0]) return showModalMessage(modal2, "Please select a file!", "error");
                const formData = new FormData();
                formData.append("file", fileInput.files[0]);
                formData.append("quizName", quizName);
                formData.append("quizId", quizId);

                authFetch("/upload/questions", { method: "POST", body: formData })
                  .then(res => res.text())
                  .then(data => {
                    showModalMessage(modal2, data, "success");
                    setTimeout(() => document.body.removeChild(overlay2), 2000);
                  })
                  .catch(err => showModalMessage(modal2, "Error: " + err, "error"));
              }
            );
          })
          .catch(err => showModalMessage(modal, "Error: " + err, "error"));
      }
    );
  });

  // ===== Activate / Deactivate Quiz =====
  activateQuizBtn.addEventListener("click", async () => {
    // Make sure departments are loaded
    if (!departmentsList || departmentsList.length === 0) await loadDepartments();

    // Modal HTML
    const modalHTML = `
      <p>Enter quiz details to activate/deactivate:</p>
      <input type="text" id="actQuizId" placeholder="Quiz ID">
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
        ${departmentsList}
      </select>
      <select id="actYear">
        <option value="">Select Year</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>
      <input type="number" id="actDuration" placeholder="Duration in minutes (0 for no limit)" min="0">
      <select id="actStatus">
        <option value="true">Activate</option>
        <option value="false">Deactivate</option>
      </select>
    `;

    // Create modal
    createModal("Activate / Deactivate Quiz", modalHTML, (modal, overlay) => {
      const quizId = modal.querySelector("#actQuizId").value.trim();
      const section = modal.querySelector("#actSection").value;
      const department = modal.querySelector("#actDepartment").value;
      const year = modal.querySelector("#actYear").value;
      const durationMinutes = parseInt(modal.querySelector("#actDuration").value) || 0;
      const active = modal.querySelector("#actStatus").value;

      if (!quizId || !section || !department || !year) {
        return showModalMessage(modal, "Please select all fields", "error");
      }

      const url = `/quiz/activate?quizId=${quizId}&section=${section}&department=${department}&year=${year}&active=${active}&durationMinutes=${durationMinutes}`;

      authFetch(url, { method: "POST" })
        .then(async res => {
          const message = await res.text();
          if (res.ok) {
            showModalMessage(modal, message, "success");
            setTimeout(() => document.body.removeChild(overlay), 2000);
          } else {
            showModalMessage(modal, message, "error");
          }
        })
        .catch(err => showModalMessage(modal, "Error: " + err, "error"));
    });
  });


  // ===== Publish / Unpublish Result =====
  publishResultBtn.addEventListener("click", async () => {
    // ensure departments are loaded
    if (!departmentsList || departmentsList.length === 0) await loadDepartments();

    const modalHTML = `
      <input type="text" id="pubQuizId" placeholder="Quiz ID">

      <select id="pubSection">
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

      <select id="pubDepartment">
        <option value="">Select Department</option>
        ${departmentsList}
      </select>

      <select id="pubYear">
        <option value="">Select Year</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
      </select>

      <select id="pubStatus">
        <option value="true">Publish</option>
        <option value="false">Unpublish</option>
      </select>
    `;

    createModal("Publish / Unpublish Result", modalHTML, (modal, overlay) => {
      const quizId = modal.querySelector("#pubQuizId").value.trim();
      const section = modal.querySelector("#pubSection").value;
      const department = modal.querySelector("#pubDepartment").value;
      const year = modal.querySelector("#pubYear").value;
      const publish = modal.querySelector("#pubStatus").value;

      if (!quizId || !section || !department || !year) {
        return showModalMessage(modal, "Please select all fields", "error");
      }

      const url = `/quiz/${quizId}/publish-result?section=${section}&department=${department}&year=${year}&publish=${publish}`;

      authFetch(url, { method: "POST" })
        .then(async res => {
          const message = await res.text();
          if (res.ok) {
            showModalMessage(modal, message, "success");
            setTimeout(() => document.body.removeChild(overlay), 2000);
          } else {
            showModalMessage(modal, message, "error");
          }
        })
        .catch(err =>
          showModalMessage(modal, "Error: " + err, "error")
        );
    });
  });

  // ===== View Class Results with Download & Analysis =====
  viewClassResultsBtn.addEventListener("click", () => {
    facultyDashboard.classList.add("hidden");
    const prevSection = document.getElementById("classResultsSection");
    if (prevSection) prevSection.remove();

	const section = document.createElement("div");
	section.id = "classResultsSection";
	section.innerHTML = `
	  <div class="results-filters">
	    <input type="text" id="filterQuizId" placeholder="Quiz ID (Required)">

	    <select id="filterDepartment">
	      <option value="">Department (Optional)</option>
	      ${departmentsList}
	    </select>

	    <select id="filterSection">
	      <option value="">Section (Optional)</option>
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

	    <select id="filterYear">
	      <option value="">Year (Optional)</option>
	      <option value="1">1</option>
	      <option value="2">2</option>
	      <option value="3">3</option>
	      <option value="4">4</option>
	    </select>

	    <select id="sortBy">
	      <option value="rank">Sort by Rank</option>
	      <option value="roll">Sort by Roll Number</option>
	    </select>

	    <button id="filterResultsBtn">View Results</button>
	  </div>

	  <table class="results-table">
	    <thead>
	      <tr>
	        <th>Rank</th>
	        <th>Roll No</th>
	        <th>Student Name</th>
	        <th>Quiz ID</th>
	        <th>Quiz Name</th>
	        <th>Score</th>
	        <th>Total Marks</th>
	        <th>Pass/Fail</th>
	        <th>Submission Time</th>
	      </tr>
	    </thead>
	    <tbody id="resultsTableBody"></tbody>
	  </table>

	  <button id="backToDashboard">Back</button>
	`;
	facultyContainer.appendChild(section);


    const filterBtn = section.querySelector("#filterResultsBtn");
    const analysisBtn = section.querySelector("#viewAnalysisBtn");
    const backBtn = section.querySelector("#backToDashboard");
    const tableBody = section.querySelector("#resultsTableBody");

    // ===== Download + Back Buttons =====
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download Results";
    downloadBtn.id = "downloadResultsBtn";
    downloadBtn.style.cssText = "background:#4CAF50;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;font-weight:bold;margin-left:10px;";
    const buttonsWrapper = document.createElement("div");
    buttonsWrapper.style.cssText = "margin-top:20px;display:flex;justify-content:center;gap:15px;";
    backBtn.style.cssText = "padding:10px 20px;border-radius:5px;cursor:pointer;";
    buttonsWrapper.appendChild(backBtn);
    buttonsWrapper.appendChild(downloadBtn);
    section.appendChild(buttonsWrapper);

    // ===== Filter Results =====
    filterBtn.addEventListener("click", () => {
      const quizId = section.querySelector("#filterQuizId").value.trim();
      const department = section.querySelector("#filterDepartment").value;
      const sec = section.querySelector("#filterSection").value;
      const year = section.querySelector("#filterYear").value;
      const sortBy = section.querySelector("#sortBy").value;
      if (!quizId) return alert("Quiz ID is mandatory");

      let url = `/results/faculty/ranking?quizId=${encodeURIComponent(quizId)}&sortBy=${sortBy}`;
      if (department) url += `&department=${encodeURIComponent(department)}`;
      if (sec) url += `&section=${encodeURIComponent(sec)}`;
      if (year) url += `&year=${encodeURIComponent(year)}`;

      authFetch(url).then(res => res.json()).then(data => {
        tableBody.innerHTML = "";
        if (!data || data.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="9">No results found</td></tr>`;
          return;
        }
        data.forEach(r => {
          tableBody.innerHTML += `<tr>
            <td>${r.rank ?? "-"}</td>
            <td>${r.student?.studentRollNumber ?? ""}</td>
            <td>${r.student?.studentName ?? ""}</td>
            <td>${r.quiz?.quizId ?? ""}</td>
            <td>${r.quiz?.quizName ?? ""}</td>
            <td>${r.score ?? 0}</td>
            <td>${r.totalMarks ?? "-"}</td>
            <td>${r.passFail ?? "-"}</td>
            <td>${r.submissionTime ? new Date(r.submissionTime).toLocaleString() : ""}</td>
          </tr>`;
        });
      }).catch(() => alert("Error fetching results"));
    });

    // ===== Download =====
    downloadBtn.addEventListener("click", async () => {
      const quizId = section.querySelector("#filterQuizId").value.trim();
      if (!quizId) return alert("Quiz ID is mandatory to download results");

      const department = section.querySelector("#filterDepartment").value;
      const sec = section.querySelector("#filterSection").value;
      const year = section.querySelector("#filterYear").value;

      let url = `/results/download?quizId=${encodeURIComponent(quizId)}`;
      if (department) url += `&department=${encodeURIComponent(department)}`;
      if (sec) url += `&section=${encodeURIComponent(sec)}`;
      if (year) url += `&year=${encodeURIComponent(year)}`;

      try {
        const res = await authFetch(url, { method: "GET" });
        if (!res.ok) return alert("Failed to download file.");
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `class_results_${quizId}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error(err);
        alert("Error downloading file: " + err.message);
      }
    });
    // ===== Back Button =====
    backBtn.addEventListener("click", () => {
      section.remove();
      facultyDashboard.classList.remove("hidden");
    });
  });

  // ===== Logout =====
  facultyLogout.addEventListener("click", () => location.reload());
})();
