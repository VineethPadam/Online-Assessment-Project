(() => {
  // ===== Elements =====
  const facultyDashboard = document.getElementById("facultyDashboard");
  const addQuizBtn = document.getElementById("addQuizBtn");
  const activateQuizBtn = document.getElementById("activateQuizBtn");
  const viewClassResultsBtn = document.getElementById("viewClassResultsBtn");
  const publishResultBtn = document.getElementById("publishResultBtn");
  const studentAnalysisBtn = document.getElementById("studentAnalysisBtn");
  const myExamsBtn = document.getElementById("myExamsBtn");

  const facultyHomeCards = document.getElementById("facultyHomeCards");
  const manageExamsCategoryBtn = document.getElementById("manageExamsCategoryBtn");
  const viewResultsCategoryBtn = document.getElementById("viewResultsCategoryBtn");
  const examsCategorySection = document.getElementById("examsCategorySection");
  const resultsCategorySection = document.getElementById("resultsCategorySection");
  const backFromExamsCategory = document.getElementById("backFromExamsCategory");
  const backFromResultsCategory = document.getElementById("backFromResultsCategory");

  const facultyContainer = facultyDashboard?.parentElement;
  let departmentsListHTML = "";

  function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Initialize faculty logic
  function init() {
    // We try to load departments immediately if we have a token.
    // If not, it will be triggered by button clicks.
    if (sessionStorage.getItem("token")) {
      loadDepartments();
    }

    // Category Navigation
    manageExamsCategoryBtn?.addEventListener("click", () => {
      facultyHomeCards.classList.add("hidden");
      examsCategorySection.classList.remove("hidden");
    });

    viewResultsCategoryBtn?.addEventListener("click", () => {
      facultyHomeCards.classList.add("hidden");
      resultsCategorySection.classList.remove("hidden");
    });

    backFromExamsCategory?.addEventListener("click", () => {
      examsCategorySection.classList.add("hidden");
      facultyHomeCards.classList.remove("hidden");
    });

    backFromResultsCategory?.addEventListener("click", () => {
      resultsCategorySection.classList.add("hidden");
      facultyHomeCards.classList.remove("hidden");
    });
  }

  // Load departments and update any open dropdowns
  async function loadDepartments() {
    if (departmentsListHTML) return departmentsListHTML;
    try {
      const res = await authFetch("/departments");
      if (res.ok) {
        const depts = await res.json();
        departmentsListHTML = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
        // Inject into any currently visible dropdowns
        document.querySelectorAll(".dept-select-dynamic").forEach(select => {
          const currentVal = select.value;
          select.innerHTML = '<option value="">Select Department</option>' + departmentsListHTML;
          if (currentVal) select.value = currentVal;
        });
      }
    } catch (err) { console.error("Department load error", err); }
    return departmentsListHTML;
  }

  // ===== Utility: Create Modal =====
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
    submitBtn.textContent = options.submitText || "Save Changes";
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

  // ===== 1. Bulk Student Upload (REMOVED - MOVED TO ADMIN) =====
  /*
  uploadStudentBtn?.addEventListener("click", () => {
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
      });
  });
  */

  // ===== 2. Create Quiz =====
  addQuizBtn?.addEventListener("click", () => {
    createModal("New Quiz Setup", `
      <label class="input-label">Quiz Name</label><input type="text" id="qN" placeholder="e.g. Computer Networks Unit 1">
      <label class="input-label">Quiz Code</label><input type="text" id="qC" placeholder="e.g. CN-U1">
    `, (m, o) => {
      const n = m.querySelector("#qN").value; const c = m.querySelector("#qC").value;
      if (!n || !c) return showMsg(m, "Both fields required", "error");
      authFetch(`/quiz/create?quizId=${c}&quizName=${encodeURIComponent(n)}`, { method: "POST" }).then(async r => {
        if (r.ok) { o.remove(); openManageQuestions(await r.json()); }
        else showMsg(m, await r.text(), "error");
      });
    });
  });

  // ===== 3. Advanced Question Editor =====
  function openQuestionEditor(quiz, allQuestions, startIndex = 0) {
    let currentIndex = startIndex;
    const isNew = startIndex === -1;

    const editorHTML = `
      <div id="editorContent">
        <label class="input-label">Question Text</label>
        <textarea id="edText" style="min-height:100px;"></textarea>
        
        <label class="input-label">Question Image (Optional)</label>
        <input type="file" id="edImg" accept="image/*" style="margin-bottom:15px;">
        <div id="edImgPreview" style="margin-bottom:20px; max-height:150px; overflow:hidden; border-radius:8px; display:none;"></div>

        <label class="input-label">Options (Mark correct answer)</label>
        <div id="edOptList"></div>
        <button id="edAddOpt" class="add-opt-btn" style="padding:10px; font-size:13px; margin-bottom:20px;">+ Add Option</button>
        
        <div class="input-group-row">
          <div><label class="input-label">Marks</label><input type="number" id="edMarks" value="1"></div>
          <div><label class="input-label">Neg Marks</label><input type="number" id="edNeg" value="0"></div>
          <div><label class="input-label">Time (s)</label><input type="number" id="edTime" placeholder="Opt"></div>
        </div>

        <div class="editor-nav-container">
           <button id="prevQ" class="nav-btn">← Previous</button>
           <div class="question-counter" id="qCounter">Question 1 of 1</div>
           <button id="nextQ" class="nav-btn">Next →</button>
        </div>
      </div>
    `;

    const modal = createModal(
      isNew ? "Add New Question" : "Edit Question",
      editorHTML,
      (m, o) => saveQuestion(m, o),
      { submitText: "Save Question", cancelText: "Close Editor", maxWidth: "650px" }
    );

    const edText = modal.querySelector("#edText");
    const edOptList = modal.querySelector("#edOptList");
    const edMarks = modal.querySelector("#edMarks");
    const edNeg = modal.querySelector("#edNeg");
    const edTime = modal.querySelector("#edTime");
    const qCounter = modal.querySelector("#qCounter");
    const prevBtn = modal.querySelector("#prevQ");
    const nextBtn = modal.querySelector("#nextQ");

    function renderCurrent() {
      if (currentIndex === -1) {
        edText.value = ""; edOptList.innerHTML = "";
        edMarks.value = 1; edNeg.value = 0; edTime.value = "";
        qCounter.textContent = "New Question Entry";
        prevBtn.style.display = nextBtn.style.display = "none";
        addOptionRow(); addOptionRow();
        return;
      }

      const q = allQuestions[currentIndex];
      edText.value = q.questionText;
      edMarks.value = q.marks;
      edNeg.value = q.negativeMarks;
      edTime.value = q.timeLimitSeconds || "";
      qCounter.textContent = `Question ${currentIndex + 1} of ${allQuestions.length}`;

      // Handle Image Preview
      const imgPreview = modal.querySelector("#edImgPreview");
      if (q.questionImage) {
        imgPreview.innerHTML = `<img src="${q.questionImage}" style="max-width:100%; height:auto; border:1px solid #ddd;">`;
        imgPreview.style.display = "block";
      } else {
        imgPreview.style.display = "none";
      }

      prevBtn.style.display = nextBtn.style.display = "flex";
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === allQuestions.length - 1;

      edOptList.innerHTML = "";
      const correctOnes = (q.options?.correctOption || "").split(",").map(s => s.trim());
      const choiceImgs = q.options?.choiceImages || [];
      (q.options?.choices || []).forEach((choice, idx) => addOptionRow(choice, correctOnes.includes(choice), choiceImgs[idx]));
    }

    function addOptionRow(val = "", isCorrect = false, imgData = "") {
      const row = document.createElement("div");
      row.className = "option-row";
      row.style.flexDirection = "column";
      row.style.alignItems = "stretch";

      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <input type="text" class="opt-val" value="${val}" placeholder="Enter option..." style="flex:1;">
          <label class="is-correct-wrapper"><input type="checkbox" class="is-correct" ${isCorrect ? 'checked' : ''}> Correct</label>
          <button class="remove-opt-btn">×</button>
        </div>
        <div style="margin-top:8px; display:flex; align-items:center; gap:10px;">
           <input type="file" class="opt-img-input" accept="image/*" style="font-size:11px; margin:0; padding:5px;">
           <div class="opt-img-preview" style="max-height:50px; overflow:hidden;">
              ${imgData ? `<img src="${imgData}" style="height:40px;">` : ""}
           </div>
        </div>
      `;
      row.querySelector(".remove-opt-btn").onclick = () => row.remove();
      edOptList.appendChild(row);
    }

    async function saveQuestion(m, o, silent = false) {
      const choices = []; const correct = []; const choiceImages = [];

      for (const r of m.querySelectorAll(".option-row")) {
        const v = r.querySelector(".opt-val").value.trim();
        if (v) {
          choices.push(v);
          if (r.querySelector(".is-correct").checked) correct.push(v);

          const imgInput = r.querySelector(".opt-img-input");
          const existingImg = r.querySelector(".opt-img-preview img");

          if (imgInput.files[0]) {
            choiceImages.push(await getBase64(imgInput.files[0]));
          } else if (existingImg) {
            choiceImages.push(existingImg.src);
          } else {
            choiceImages.push("");
          }
        }
      }

      const txt = edText.value.trim();
      if (!txt || choices.length < 2 || !correct.length) {
        if (!silent) showMsg(m, "Required: text, 2+ options, & 1+ correct.", "error");
        return Promise.reject();
      }

      const qImgInput = m.querySelector("#edImg");
      const existingQImg = m.querySelector("#edImgPreview img");
      let qImageData = "";
      if (qImgInput.files[0]) {
        qImageData = await getBase64(qImgInput.files[0]);
      } else if (existingQImg) {
        qImageData = existingQImg.src;
      }

      const payload = {
        questionText: txt, options: choices, correctOption: correct.join(","),
        marks: edMarks.value, negativeMarks: edNeg.value,
        timeLimit: edTime.value || null,
        questionImage: qImageData,
        choiceImages: choiceImages
      };

      const qId = currentIndex >= 0 ? allQuestions[currentIndex].questionId : null;
      const url = isNew ? `/quiz/${quiz.id}/questions/add` : `/quiz/questions/${qId}`;
      const method = isNew ? "POST" : "PUT";

      return authFetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(async r => {
        if (r.ok) {
          if (!silent) {
            showMsg(m, "Saved!");
            setTimeout(() => { o.remove(); openManageQuestions(quiz); }, 1000);
          }
          return r.json();
        } else {
          showMsg(m, "Save error.", "error");
          throw "error";
        }
      });
    }

    modal.querySelector("#edAddOpt").onclick = () => addOptionRow();
    prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; renderCurrent(); } };
    nextBtn.onclick = () => { if (currentIndex < allQuestions.length - 1) { currentIndex++; renderCurrent(); } };

    renderCurrent();
  }

  // ===== 4. Manage Questions Home =====
  function openManageQuestions(quiz) {
    document.getElementById("manageQuestionsUI")?.remove();
    document.getElementById("myExamsUI")?.classList.add("hidden");
    facultyDashboard.classList.add("hidden");

    const ui = document.createElement("div");
    ui.id = "manageQuestionsUI";
    ui.className = "manage-questions-container";
    ui.innerHTML = `
      <div class="manage-header">
        <div>
          <h2 style="margin:0; font-size: 28px; font-weight:900; color:var(--text-main);">${quiz.quizName}</h2>
          <p style="color:var(--text-muted); margin-top:5px; font-weight:600;">Managing Questions • Code: <strong style="color:var(--primary);">${quiz.quizCode}</strong></p>
        </div>
        <div style="display:flex; gap:12px;">
          <button id="addQHome" class="btn-premium btn-primary-grad">+ Add Question</button>
          <button id="backHome" class="btn-premium btn-secondary-outline">Back to Library</button>
        </div>
      </div>
      <div class="manage-body">
        <div id="qListHome" class="questions-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap:25px;"></div>
      </div>
    `;
    facultyContainer.appendChild(ui);

    const loadQs = () => {
      authFetch(`/quiz/${quiz.id}/questions`).then(r => {
        if (!r.ok) throw new Error("Load failed");
        return r.json();
      }).then(qs => {
        if (!Array.isArray(qs)) qs = [];
        const list = ui.querySelector("#qListHome");
        list.innerHTML = qs.length ? "" : `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#94a3b8;">No questions found.</div>`;
        qs.forEach((q, i) => {
          const card = document.createElement("div");
          card.className = "question-card";
          card.style.cursor = "pointer";
          card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
               <span style="font-size:12px; font-weight:800; color:var(--primary); text-transform:uppercase;">Question ${i + 1}</span>
               <button class="small-delete-btn" style="float:none;">Delete</button>
            </div>
            <div style="font-weight:700; color:var(--text-main); font-size:1.0rem; line-height:1.6; white-space: pre-wrap; font-family: 'Consolas', monospace; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 10px 0;">${q.questionText}</div>
            <div class="meta-pill"><span>${q.marks} Marks</span><span>-${q.negativeMarks} Neg</span></div>
            <div style="margin-top:15px; color:var(--text-muted); font-size:0.85rem; font-weight:600; display:flex; align-items:center; gap:5px;">
               <span>Options: <b>${q.options?.choices?.length || 0}</b></span>
               ${q.timeLimitSeconds ? `<span style="margin-left:auto;">⏱️ ${q.timeLimitSeconds}s</span>` : ''}
            </div>
          `;
          card.onclick = (e) => {
            if (e.target.classList.contains('small-delete-btn')) {
              if (confirm("Delete this question?")) authFetch(`/quiz/questions/${q.questionId}`, { method: "DELETE" }).then(r => { if (r.ok) loadQs(); });
              return;
            }
            openQuestionEditor(quiz, qs, i);
          };
          list.appendChild(card);
        });
      }).catch(err => {
        ui.querySelector("#qListHome").innerHTML = `<div style="grid-column:1/-1; color:red; text-align:center;">Failed to load questions.</div>`;
      });
    };
    loadQs();

    ui.querySelector("#addQHome").onclick = () => openQuestionEditor(quiz, [], -1);
    ui.querySelector("#backHome").onclick = () => {
      ui.remove();
      const myUI = document.getElementById("myExamsUI");
      if (myUI) myUI.classList.remove("hidden"); else facultyDashboard.classList.remove("hidden");
    };
  }

  // ===== 5. My Conducted Exams =====
  function refreshExamsList(ui) {
    const grid = ui.querySelector("#examGrid");
    grid.innerHTML = "<div style='grid-column:1/-1; text-align:center;'>Loading...</div>";
    authFetch("/quiz/my-exams").then(r => r.json()).then(data => {
      grid.innerHTML = data.length ? "" : `<div style='grid-column:1/-1; text-align:center; padding:40px; color:#94a3b8;'>No exams found.</div>`;
      data.forEach(ex => {
        const card = document.createElement("div");
        card.className = "exam-card";
        card.innerHTML = `
          <div>
            <h4 style="margin:0;">${ex.quizName}</h4>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
              <span class="badge" style="background:rgba(99, 102, 241, 0.1); color:var(--primary);">Code: ${ex.quizCode}</span>
              <span class="badge">Internal ID: ${ex.id}</span>
            </div>
          </div>
          <div class="exam-card-actions" style="margin-top:30px; display:flex; gap:12px;">
            <button class="btn-premium btn-primary-grad manage-btn" style="flex:2;">Open Hub</button>
            <button class="delete-quiz-btn" style="flex:1; background:#fee2e2; color:#ef4444; border:none; border-radius:12px; cursor:pointer; font-weight:800; font-size:12px; text-transform:uppercase;">Delete</button>
          </div>
        `;
        card.querySelector(".manage-btn").onclick = () => openManageQuestions(ex);
        card.querySelector(".delete-quiz-btn").onclick = () => { if (confirm(`Delete quiz "${ex.quizName}"?`)) authFetch(`/quiz/${ex.id}`, { method: "DELETE" }).then(r => { if (r.ok) refreshExamsList(ui); }); };
        grid.appendChild(card);
      });
    });
  }

  myExamsBtn?.addEventListener("click", () => {
    facultyDashboard.classList.add("hidden");
    let ui = document.getElementById("myExamsUI");
    if (!ui) {
      ui = document.createElement("div");
      ui.id = "myExamsUI";
      ui.className = "manage-questions-container";
      facultyContainer.appendChild(ui);
    }
    ui.classList.remove("hidden");
    ui.innerHTML = `
      <div class="manage-header">
        <h2 style="margin:0; font-size: 28px; font-weight:900; color:var(--text-main);">My Exam Library</h2>
        <button id="closeExams" class="btn-premium btn-secondary-outline">Back to Dashboard</button>
      </div>
      <div class="manage-body">
        <div id="examGrid" class="exam-grid"></div>
      </div>
    `;
    refreshExamsList(ui);
    ui.querySelector("#closeExams").onclick = () => { ui.remove(); facultyDashboard.classList.remove("hidden"); };
  });

  // ===== 6. Class Results Hub =====
  viewClassResultsBtn?.addEventListener("click", () => {
    // Ensure departments are loaded
    loadDepartments();

    facultyDashboard.classList.add("hidden");
    const resUI = document.createElement("div");
    resUI.id = "classResultsUI";
    resUI.className = "manage-questions-container";
    resUI.innerHTML = `
      <div class="manage-header">
        <div>
          <h2 style="margin:0; font-size: 28px; font-weight:900;">Academic Ranking Hub</h2>
          <p style="color:var(--text-muted); margin-top:5px; font-weight:600;">Monitor and export student performance data.</p>
        </div>
        <button id="closeRes" class="btn-premium btn-secondary-outline">Back to Dashboard</button>
      </div>
      
      <div class="manage-body">
        <div class="filter-panel" style="background:white; padding:35px; border-radius:20px; border:1px solid var(--border); margin-bottom:40px; display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:25px; box-shadow:var(--shadow-sm);">
          <div class="filter-item">
            <label class="input-label" style="margin:0 0 8px;">Quiz ID</label>
            <input type="number" id="fId" placeholder="Internal ID" style="margin:0; height:50px;">
          </div>
          <div class="filter-item">
            <label class="input-label" style="margin:0 0 8px;">Department</label>
            <select id="fDept" class="dept-select-dynamic" style="margin:0; height:50px;">
              <option value="">All Departments</option>
              ${departmentsListHTML}
            </select>
          </div>
          <div class="filter-item">
            <label class="input-label" style="margin:0 0 8px;">Section</label>
            <select id="fSec" style="margin:0; height:50px;"><option value="">All Sections</option>${["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map(s => `<option value="${s}">${s}</option>`).join("")}</select>
          </div>
          <div class="filter-item">
            <label class="input-label" style="margin:0 0 8px;">Year</label>
            <select id="fYear" style="margin:0; height:50px;"><option value="">All Years</option>${[1, 2, 3, 4].map(y => `<option value="${y}">${y}</option>`).join("")}</select>
          </div>
          
          <div style="grid-column: 1/-1; display:flex; gap:15px; margin-top:10px; border-top:1px solid var(--border); padding-top:25px;">
            <button id="vBtn" class="btn-premium btn-primary-grad" style="flex:2; height:54px;">🔍 Fetch Rankings</button>
            <div style="display:flex; gap:10px;">
              <button id="sortRankBtn" class="btn-premium btn-secondary-outline" style="height:54px;">Rank</button>
              <button id="sortRollBtn" class="btn-premium btn-secondary-outline" style="height:54px;">Roll No</button>
            </div>
          </div>
        </div>
        
          <table style="width:100%; border-collapse:collapse;">
            <thead style="background:var(--background); border-bottom:2px solid var(--border);">
              <tr>
                <th style="padding:15px 20px; text-align:left; color:var(--text-main); font-weight:800; font-size:12px; text-transform:uppercase;">Rank</th>
                <th style="padding:15px 20px; text-align:left; color:var(--text-main); font-weight:800; font-size:12px; text-transform:uppercase;">Roll Number</th>
                <th style="padding:15px 20px; text-align:left; color:var(--text-main); font-weight:800; font-size:12px; text-transform:uppercase;">Student Name</th>
                <th style="padding:15px 20px; text-align:left; color:var(--text-main); font-weight:800; font-size:12px; text-transform:uppercase;">Dept-Sec-Year</th>
                <th style="padding:15px 20px; text-align:left; color:var(--text-main); font-weight:800; font-size:12px; text-transform:uppercase;">Quiz Code/Name</th>
                <th style="padding:15px 20px; text-align:left; color:var(--text-main); font-weight:800; font-size:12px; text-transform:uppercase;">Score</th>
                <th style="padding:15px 20px; text-align:left; color:var(--text-main); font-weight:800; font-size:12px; text-transform:uppercase;">Pass/Fail</th>
                <th style="padding:15px 20px; text-align:left; color:var(--text-main); font-weight:800; font-size:12px; text-transform:uppercase;">Submitted At</th>
              </tr>
            </thead>
            <tbody id="resBody">
              <tr><td colspan="8" style="text-align:center; padding:100px; color:var(--text-muted); font-size:16px;">Set criteria and search for results</td></tr>
            </tbody>
          </table>

        <div style="margin-top:30px; display:flex; justify-content:flex-end;">
          <button id="exBtn" class="btn-premium" style="background:#10b981; color:white; min-width:220px; box-shadow:0 10px 20px rgba(16, 185, 129, 0.2);">
            <span style="font-size:20px;">📊</span> Export to Excel
          </button>
        </div>
      </div>
    `;
    facultyContainer.appendChild(resUI);

    resUI.querySelector("#vBtn").onclick = () => {
      const q = resUI.querySelector("#fId").value; if (!q) return alert("Please enter a Quiz ID to search.");
      const resBody = resUI.querySelector("#resBody");
      resBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:50px;"><div class="loading-spinner"></div><p style="margin-top:15px; color:#64748b; font-weight:600;">Processing results...</p></td></tr>`;

      fetchResults(q, "rank");
    };

    function fetchResults(quizId, sortBy) {
      const resBody = resUI.querySelector("#resBody");
      authFetch(`/results/faculty/ranking?quizId=${quizId}&department=${resUI.querySelector("#fDept").value}&section=${resUI.querySelector("#fSec").value}&year=${resUI.querySelector("#fYear").value}&sortBy=${sortBy}`)
        .then(r => r.json()).then(data => {
          if (!data || data.length === 0) {
            resBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:60px; color:#64748b;">No records found matching filters.</td></tr>`;
            return;
          }
          resBody.innerHTML = data.map(r => `
          <tr style="border-bottom:1px solid var(--border); transition:background 0.2s;" onmouseover="this.style.background='var(--background)'" onmouseout="this.style.background='transparent'">
            <td style="padding:15px 20px;"><span style="background:var(--primary); color:white; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px;">#${r.rank}</span></td>
            <td style="padding:15px 20px; color:var(--text-muted); font-weight:700; font-size:13px;">${r.student.studentRollNumber}</td>
            <td style="padding:15px 20px; font-weight:800; color:var(--text-main); font-size:14px;">${r.student.studentName}</td>
            <td style="padding:15px 20px; font-size:13px; color:var(--text-muted);">${r.student.department}-${r.student.studentSection}-${r.student.studentYear}</td>
            <td style="padding:15px 20px;"><div style="font-weight:700; font-size:14px; color:var(--text-main);">${r.quiz.quizName}</div><div style="font-size:11px; color:var(--primary); font-weight:800;">CODE: ${r.quiz.quizCode}</div></td>
            <td style="padding:15px 20px;"><span style="background:var(--background); color:var(--text-main); padding:6px 12px; border-radius:8px; font-weight:900; font-size:14px;">${r.score.toFixed(1)} <small style="color:var(--text-muted); font-weight:600; font-size:11px;">/ ${r.totalMarks}</small></span></td>
            <td style="padding:15px 20px;"><span class="status-badge ${r.passFail === 'Pass' ? 'status-pass' : 'status-fail'}" style="padding:6px 12px; font-weight:800; font-size:11px;">${r.passFail}</span></td>
            <td style="padding:15px 20px; font-size:11px; color:var(--text-muted); font-weight:600;">${new Date(r.submissionTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
          </tr>
        `).join("");
        }).catch(err => {
          resBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ef4444; padding:50px; font-weight:600;">⚠️ Failed to load performance data. Check server connectivity.</td></tr>`;
        });
    }

    resUI.querySelector("#sortRankBtn").onclick = () => {
      const q = resUI.querySelector("#fId").value; if (!q) return;
      fetchResults(q, "rank");
    };
    resUI.querySelector("#sortRollBtn").onclick = () => {
      const q = resUI.querySelector("#fId").value; if (!q) return;
      fetchResults(q, "roll");
    };

    resUI.querySelector("#exBtn").onclick = () => {
      const q = resUI.querySelector("#fId").value; if (!q) return alert("Quiz ID is required for Excel export.");
      const btn = resUI.querySelector("#exBtn");
      const originalText = btn.innerHTML;
      btn.innerHTML = `<div class="loading-spinner" style="width:20px; height:20px; margin:0; border-width:2px; border-top-color:white;"></div> Preparing...`;
      btn.disabled = true;

      fetch(`/results/download?quizId=${q}&department=${resUI.querySelector("#fDept").value}&section=${resUI.querySelector("#fSec").value}&year=${resUI.querySelector("#fYear").value}`, { headers: { "Authorization": "Bearer " + sessionStorage.getItem("token") } })
        .then(r => {
          if (!r.ok) throw new Error("Export failed");
          return r.blob();
        })
        .then(blob => {
          const u = URL.createObjectURL(blob); const a = document.createElement('a');
          a.href = u; a.download = `Results_Quiz_${q}_${new Date().toLocaleDateString()}.xlsx`;
          document.body.appendChild(a); a.click(); a.remove();
        })
        .catch(e => alert(e.message))
        .finally(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
        });
    };
    resUI.querySelector("#closeRes").onclick = () => { resUI.remove(); facultyDashboard.classList.remove("hidden"); };
  });

  studentAnalysisBtn?.addEventListener("click", () => {
    // Hide results category section
    resultsCategorySection.classList.add("hidden");

    const analysisUI = document.getElementById("studentAnalysisSection");
    analysisUI.classList.remove("hidden");

    let allResults = [];
    let currentFilteredResults = [];

    analysisUI.innerHTML = `
      <div class="manage-questions-container" style="max-width:1200px;">
        <div class="manage-header" style="flex-direction:column; text-align:center; padding: 40px; background: #fff; border-radius: 30px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
          <h2 style="margin:0; font-size:36px; font-weight:900; background:linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;">Student Performance Analytics</h2>
          <p style="color:var(--text-muted); margin-top:10px; font-size:18px;">Unlock deep performance insights with roll-number based analysis.</p>
          
          <div class="search-box-wrapper" style="margin-top:35px; width:100%; max-width:700px; display:flex; gap:0;">
             <input type="text" id="analysisRollNumber" placeholder="Reg / Roll Number (e.g. 21XX1A0501)" style="height:62px; border-radius:18px 0 0 18px; border:2px solid #eef2f6; border-right:none; font-size:18px; padding-left:25px; width: 100%;">
             <button id="getAnalysisBtn" class="btn-premium btn-primary-grad" style="height:62px; border-radius:0 18px 18px 0; min-width:160px; font-size:16px;">🔍 Analyze</button>
          </div>
        </div>

        <div id="analyticsDashboard" class="hidden">
           <!-- Dashboard row for Filters and Graphs -->
           <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:30px; margin-bottom:30px;">
              
              <!-- Left: Subject Filter & Overall Chart -->
              <div class="analysis-card" style="display:flex; flex-direction:column; gap:20px; min-height:450px; background:#fff; border-radius:24px;">
                 <div>
                    <h3 style="margin:0 0 10px; font-size:18px; font-weight:800; color:var(--text-main);">Subject Focus</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-bottom:15px;">Search by specific quiz name to target metrics.</p>
                    <input type="text" id="quizNameFilter" placeholder="Filter by Name (e.g. Java, Python)" style="height:54px; border-radius:14px; width:100%; border:2px solid #eef2f6; padding:0 20px; font-weight:600; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                 </div>
                 <div style="flex:1; display:flex; align-items:center; justify-content:center; padding-top: 20px;">
                    <canvas id="overallPassFailChart" style="max-height:280px; width:100% !important;"></canvas>
                 </div>
              </div>

              <!-- Right: Performance Over Time / Subject Profile -->
              <div class="analysis-card" style="display:flex; flex-direction:column; gap:20px; min-height:450px; background:#fff; border-radius:24px;">
                 <h3 id="subjectTitle" style="margin:0; font-size:18px; font-weight:800; color:var(--text-main);">Subject Performance Profile</h3>
                 <div id="subjectMetricContainer" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:25px;">
                    <canvas id="subjectPerformanceChart" style="max-height:280px; width:100% !important;"></canvas>
                    <div id="subjectStatsBadges" style="display:flex; gap:15px; flex-wrap:wrap; justify-content:center;"></div>
                 </div>
              </div>
           </div>

           <!-- Summary Stats Row -->
           <div id="analysisSummary" class="analysis-summary" style="margin-bottom:40px;"></div>

           <!-- Interactive Data Feed -->
           <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
              <h3 style="margin:0; font-size:24px; font-weight:900; color:var(--text-main);">Verified Assessment Records</h3>
              <span id="recordCount" style="background:#eef2f6; color:#6366f1; padding:6px 16px; border-radius:100px; font-weight:800; font-size:12px;">0 Records</span>
           </div>
           <div id="analysisResults" class="analysis-results-card"></div>
        </div>

        <div id="analysisEmptyState" style="text-align:center; padding:120px 40px; color:var(--text-muted); background: rgba(255,255,255,0.5); border-radius: 30px; border: 2px dashed #eef2f6;">
           <div style="font-size:100px; margin-bottom:20px; opacity:0.2;">🔍</div>
           <h3 style="font-weight:900; color:var(--text-main); font-size: 24px;">Deep Search Ready</h3>
           <p style="font-size: 16px;">Enter a student roll number to generate real-time performance visualizations.</p>
        </div>
        
        <div style="margin: 50px 0; text-align:center;">
          <button id="backFromAnalysis" class="btn-premium btn-secondary-outline" style="min-width:350px; height:60px; font-size: 16px; border-radius: 18px;">
            <svg style="width:20px; height:20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Return to Faculty Dashboard
          </button>
        </div>
      </div>
    `;

    let overallChart = null;
    let subjectChart = null;

    const getAnalysisBtn = analysisUI.querySelector("#getAnalysisBtn");
    const rollInput = analysisUI.querySelector("#analysisRollNumber");
    const filterInput = analysisUI.querySelector("#quizNameFilter");
    const dashboard = analysisUI.querySelector("#analyticsDashboard");
    const emptyState = analysisUI.querySelector("#analysisEmptyState");

    getAnalysisBtn.onclick = async () => {
      const roll = rollInput.value.trim();
      if (!roll) return alert("Please enter a Student Roll Number");

      getAnalysisBtn.innerHTML = `<div class="loading-spinner" style="width:20px; height:20px; border-top-color:white;"></div> Analyzing...`;
      getAnalysisBtn.disabled = true;

      try {
        const r = await authFetch(`/results/analysis?rollNumber=${roll}`);
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();

        if (!data || data.length === 0) {
          dashboard.classList.add("hidden");
          emptyState.classList.remove("hidden");
          emptyState.innerHTML = `<div style="font-size:80px; margin-bottom:20px;">📭</div><h3 style="color:var(--text-main); font-size: 24px;">No History Found</h3><p>Assessment records for <b>${roll}</b> are currently unavailable or non-existent.</p>`;
          return;
        }

        allResults = data;
        currentFilteredResults = data;

        dashboard.classList.remove("hidden");
        emptyState.classList.add("hidden");

        updateAnalysisDisplay();

      } catch (e) {
        console.error(e);
        alert("Integrity Error: " + e.message);
      } finally {
        getAnalysisBtn.innerHTML = "🔍 Analyze";
        getAnalysisBtn.disabled = false;
      }
    };

    filterInput.addEventListener("input", () => {
      const term = filterInput.value.toLowerCase().trim();
      if (!term) {
        currentFilteredResults = allResults;
      } else {
        currentFilteredResults = allResults.filter(r => r.quiz.quizName.toLowerCase().includes(term));
      }
      updateAnalysisDisplay(term ? filterInput.value : "Collective History");
    });

    function updateAnalysisDisplay(subjectLabel = "Collective") {
      const out = document.getElementById("analysisResults");
      const summaryOut = document.getElementById("analysisSummary");
      const countElem = document.getElementById("recordCount");
      const results = currentFilteredResults;

      countElem.textContent = `${results.length} assessment${results.length !== 1 ? 's' : ''}`;

      if (results.length === 0) {
        out.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:100px; color:var(--text-muted); background: white; border-radius: 20px;">No records match your query "${subjectLabel}"</div>`;
        summaryOut.innerHTML = "";
        return;
      }

      // 1. Summary Stats Calculation
      const total = results.length;
      const avg = (results.reduce((acc, x) => acc + x.score, 0) / total).toFixed(2);
      const passCount = results.filter(x => x.passFail === "Pass").length;
      const passRate = ((passCount / total) * 100).toFixed(0);

      summaryOut.innerHTML = `
          <div class="summary-item"><span class="label">Conduct Count</span><span class="value">${total}</span></div>
          <div class="summary-item"><span class="label">Aggregate Scoring</span><span class="value">${avg}</span></div>
          <div class="summary-item"><span class="label">Success Probability</span><span class="value" style="color:${passRate >= 40 ? '#10b981' : '#f43f5e'}">${passRate}%</span></div>
       `;

      // 2. Render Record Cards
      out.innerHTML = results.map(x => `
          <div class="analysis-card" style="border-top: 5px solid ${x.passFail === 'Pass' ? '#10b981' : '#f43f5e'}; position: relative; overflow: visible;">
            <div class="published-indicator ${x.published ? 'active' : ''}">${x.published ? 'VERIFIED' : 'PENDING'}</div>
            <span class="quiz-name" style="font-size: 18px; font-weight: 800; display: block; margin-bottom: 8px;">${x.quiz.quizName}</span>
            <div style="font-size:11px; color:#6366f1; font-weight:900; margin-bottom:20px; letter-spacing:1px; opacity: 0.8;">BATCH: ${x.quiz.quizCode} • ID: ${x.quiz.id}</div>
            
            <div class="stat-row" style="padding: 15px 0;"><span class="stat-label">National Rank</span><span class="stat-value" style="color:#6366f1; font-weight:900; font-size: 1.2rem;">#${x.rank || 'N/A'}</span></div>
            <div class="stat-row" style="padding: 15px 0;"><span class="stat-label">Points Secured</span><span class="stat-value">${x.score.toFixed(1)} <small style="color:#94a3b8; font-weight: 500;">/ ${x.totalMarks}</small></span></div>
            <div class="stat-row" style="padding: 15px 0; border: none;"><span class="stat-label">Evaluation</span><span class="status-badge ${x.passFail === 'Pass' ? 'status-pass' : 'status-fail'}" style="padding: 6px 14px; font-size: 11px;">${x.passFail}</span></div>
            
            <div style="margin-top:20px; font-size:10px; color:#94a3b8; border-top:1px solid #f1f5f9; padding-top:15px; font-weight:800; text-transform:uppercase; letter-spacing: 0.5px;">
               TIMESTOP: ${new Date(x.submissionTime).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
       `).join("");

      // 3. Render / Update Charts
      renderCharts(allResults, results, subjectLabel);
    }

    function renderCharts(all, filtered, subjectLabel) {
      // --- OVERALL CHART ---
      const allPass = all.filter(x => x.passFail === "Pass").length;
      const allFail = all.length - allPass;

      if (overallChart) overallChart.destroy();
      const ctx1 = document.getElementById("overallPassFailChart").getContext("2d");
      overallChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Pass Assessments', 'Fail Assessments'],
          datasets: [{
            data: [allPass, allFail],
            backgroundColor: ['#10b981', '#f43f5e'],
            hoverBackgroundColor: ['#059669', '#e11d48'],
            borderWidth: 8,
            borderColor: '#ffffff',
            hoverOffset: 15
          }]
        },
        options: {
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 25, font: { weight: '800', size: 12, family: 'Inter' } } },
            title: { display: true, text: 'AGGREGATE PASS/FAIL PROPORTION', font: { size: 14, weight: '900', family: 'Inter' }, padding: { bottom: 20 } }
          },
          animation: { animateRotate: true, duration: 1500 }
        }
      });

      // --- SUBJECT SPECIFIC CHART ---
      const subPass = filtered.filter(x => x.passFail === "Pass").length;
      const subFail = filtered.length - subPass;
      const subAvg = (filtered.reduce((acc, x) => acc + x.score, 0) / filtered.length).toFixed(2);

      const titleElem = document.getElementById("subjectTitle");
      titleElem.textContent = subjectLabel.toLowerCase().includes("collective") ? "Total Performance Matrix" : `Subject Insights: ${subjectLabel}`;

      if (subjectChart) subjectChart.destroy();
      const ctx2 = document.getElementById("subjectPerformanceChart").getContext("2d");
      subjectChart = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['Total Attempts', 'Successful', 'Unsuccessful'],
          datasets: [{
            label: 'Result Metrics',
            data: [filtered.length, subPass, subFail],
            backgroundColor: [
              'rgba(99, 102, 241, 0.85)',
              'rgba(16, 185, 129, 0.85)',
              'rgba(244, 63, 94, 0.85)'
            ],
            borderRadius: 12,
            barThickness: 50
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, grid: { color: '#f8fafc' }, ticks: { stepSize: 1, font: { weight: '700' } } },
            x: { grid: { display: false }, ticks: { font: { weight: '700' } } }
          },
          plugins: {
            legend: { display: false },
            title: { display: true, text: `DETAILED DATA FOR: ${subjectLabel.toUpperCase()}`, font: { size: 14, weight: '900' }, padding: 15 }
          }
        }
      });

      const badgeOut = document.getElementById("subjectStatsBadges");
      badgeOut.innerHTML = `
          <div style="background:#f8fafc; border: 2px solid #eef2f6; padding: 12px 25px; border-radius: 16px; text-align:center;">
             <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Subject Avg</div>
             <div style="font-size: 20px; font-weight: 900; color: #1e293b;">${subAvg} <small style="font-size: 12px; font-weight: 600;">pts</small></div>
          </div>
          <div style="background:#ecfdf5; border: 2px solid #d1fae5; padding: 12px 25px; border-radius: 16px; text-align:center;">
             <div style="font-size: 10px; font-weight: 800; color: #10b981; text-transform: uppercase; margin-bottom: 4px;">Success Rate</div>
             <div style="font-size: 20px; font-weight: 900; color: #065f46;">${((subPass / filtered.length) * 100).toFixed(1)}%</div>
          </div>
       `;
    }

    document.getElementById("backFromAnalysis").onclick = () => {
      if (overallChart) overallChart.destroy();
      if (subjectChart) subjectChart.destroy();

      analysisUI.classList.add("hidden");
      // Restore results category section
      resultsCategorySection.classList.remove("hidden");
    };
  });

  // Utilities
  activateQuizBtn?.addEventListener("click", () => {
    loadDepartments();
    createModal("Live Activation",
      `<label class="input-label">Quiz ID</label><input type="number" id="aI">
       <div class="input-group-row">
         <div><label class="input-label">Sec</label><select id="aS">${["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map(s => `<option value="${s}">${s}</option>`).join("")}</select></div>
         <div>
           <label class="input-label">Dept</label>
           <select id="aD" class="dept-select-dynamic">
             <option value="">Select Department</option>
             ${departmentsListHTML}
           </select>
         </div>
         <div><label class="input-label">Year</label><select id="aY"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>
       </div>
       <label class="input-label">Duration (Mins)</label><input type="number" id="aDu" value="60">
       <label class="input-label">Action</label><select id="aSt"><option value="true">Activate</option><option value="false">Deactivate</option></select>`,
      (m, o) => {
        authFetch(`/quiz/activate?quizId=${m.querySelector("#aI").value}&section=${m.querySelector("#aS").value}&department=${m.querySelector("#aD").value}&year=${m.querySelector("#aY").value}&active=${m.querySelector("#aSt").value}&durationMinutes=${m.querySelector("#aDu").value}`, { method: "POST" })
          .then(async r => { showMsg(m, await r.text(), r.ok ? "success" : "error"); if (r.ok) setTimeout(() => o.remove(), 1500); });
      });
  });

  publishResultBtn?.addEventListener("click", () => {
    loadDepartments();
    createModal("Publish Control",
      `<label class="input-label">Quiz ID</label><input type="number" id="pI">
       <div class="input-group-row">
         <div><label class="input-label">Sec</label><select id="pS">${["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map(s => `<option value="${s}">${s}</option>`).join("")}</select></div>
         <div>
           <label class="input-label">Dept</label>
           <select id="pD" class="dept-select-dynamic">
             <option value="">Select Department</option>
             ${departmentsListHTML}
           </select>
         </div>
         <div><label class="input-label">Year</label><select id="pY"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>
       </div>
       <label class="input-label">Action</label><select id="pSt"><option value="true">Publish</option><option value="false">Unpublish</option></select>`,
      (m, o) => {
        authFetch(`/quiz/${m.querySelector("#pI").value}/publish-result?section=${m.querySelector("#pS").value}&department=${m.querySelector("#pD").value}&year=${m.querySelector("#pY").value}&publish=${m.querySelector("#pSt").value}`, { method: "POST" })
          .then(async r => { showMsg(m, await r.text(), r.ok ? "success" : "error"); if (r.ok) setTimeout(() => o.remove(), 1500); });
      });
  });

  init();
})();
