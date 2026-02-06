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

  // Permission Logic
  // We read from sessionStorage dynamically because login happens without page reload.
  function checkFeature(key, name) {
    let perms = {}; // Default to empty (block if strict, or handled below)
    try {
      const u = JSON.parse(sessionStorage.getItem("user"));
      if (u && u.permissions) perms = u.permissions;
    } catch (e) { console.error("Perms parse error", e); }

    // map keys if needed (keys match backend exactly: allowCoding, allowNumeric etc.)
    // If the permission is explicitly FALSE, block it.
    // If undefined, currently defaulting to ALLOW (return true) to avoid blocking legacy/error states,
    // BUT if the user strictly wants blocking, we should check availability.
    // Given the requirement, I will check explicit false. 
    // NOTE: Backend now sends these permissions.

    if (perms[key] === false) {
      showPremiumModal(name);
      return false;
    }
    return true;
  }

  function showPremiumModal(feature) {
    createModal("Access Denied 🔒", `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 50px; margin-bottom: 20px;">💎</div>
            <h3 style="color: #6a0dad; margin-bottom: 10px;">Premium Feature</h3>
            <p style="color: #666; margin-bottom: 25px;">
                The <strong>${feature}</strong> feature is not enabled for your college.<br>
                Please contact our sales team to upgrade your plan.
            </p>
        </div>
    `, () => { }, { hideSubmit: true, maxWidth: "450px" });
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

  function showFacultyNotice(title, message, type = "info") {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.style.zIndex = "20000";

    const icon = type === "error" ? "❌" : (type === "success" ? "✅" : "ℹ️");
    const color = type === "error" ? "#ef4444" : (type === "success" ? "#10b981" : "var(--primary)");

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:450px; text-align:center; padding:40px;">
        <div style="font-size:60px; margin-bottom:20px;">${icon}</div>
        <h3 style="margin:0 0 15px; color:${color}; font-weight:900;">${title}</h3>
        <p style="color:var(--text-muted); font-weight:600; line-height:1.6; margin-bottom:30px;">${message}</p>
        <button class="btn-premium btn-primary-grad" style="width:100%; height:50px;">Understood</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("button").onclick = () => overlay.remove();
  }

  // Load departments and update any open dropdowns
  let globalDepartments = [];

  // Load departments and update any open dropdowns
  async function loadDepartments() {
    try {
      const res = await authFetch("/departments");
      if (res.ok) {
        globalDepartments = await res.json();
        departmentsListHTML = globalDepartments.map(d => `<option value="${d.name}">${d.name}</option>`).join("");

        // Refresh all dynamic selects in the document
        document.querySelectorAll(".dept-select-dynamic").forEach(select => {
          const currentVal = select.value;
          select.innerHTML = '<option value="">Select Department</option>' + departmentsListHTML;
          if (currentVal) select.value = currentVal;

          const container = select.closest('.filter-panel, .modal-content, .manage-body, .input-group-row') || select.parentElement.parentElement;
          attachDynamicListeners(container);
        });
      }
    } catch (err) { console.error("Department load error", err); }
    return departmentsListHTML;
  }

  function attachDynamicListeners(container) {
    if (!container) return;
    const deptSelect = container.querySelector(".dept-select-dynamic");
    const yearSelect = container.querySelector(".year-select-dynamic") || container.querySelector("#aY, #fYear, #pY, #sYear, #nYear");

    if (deptSelect) {
      // Populate if empty and global list is ready
      if (deptSelect.options.length <= 1 && globalDepartments.length > 0) {
        const currentVal = deptSelect.value;
        deptSelect.innerHTML = '<option value="">Select Department</option>' + globalDepartments.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
        if (currentVal) deptSelect.value = currentVal;
      }

      if (!deptSelect.dataset.listenerAdded) {
        deptSelect.addEventListener("change", () => updateYearAndSectionDropdowns(container, "dept"));
        deptSelect.dataset.listenerAdded = "true";
      }
    }
    if (yearSelect && !yearSelect.dataset.listenerAdded) {
      yearSelect.addEventListener("change", () => updateYearAndSectionDropdowns(container, "year"));
      yearSelect.dataset.listenerAdded = "true";
    }
  }

  function updateYearAndSectionDropdowns(container, triggerType = "dept") {
    const deptSelect = container.querySelector(".dept-select-dynamic");
    const yearSelect = container.querySelector(".year-select-dynamic") || container.querySelector("#aY, #fYear, #pY, #sYear, #nYear");
    const secSelect = container.querySelector(".section-select-dynamic") || container.querySelector("#aS, #fSec, #pS, #sSec, #nSec");

    if (!deptSelect) return;
    const dept = globalDepartments.find(d => d.name === deptSelect.value);

    if (triggerType === "dept") {
      if (yearSelect) {
        let yearHtml = '<option value="">Select Year</option>';
        if (dept) {
          for (let i = 1; i <= dept.years; i++) yearHtml += `<option value="${i}">${i}</option>`;
          yearSelect.disabled = false;
        } else {
          yearSelect.disabled = true;
        }
        yearSelect.innerHTML = yearHtml;
      }
      if (secSelect) {
        secSelect.innerHTML = '<option value="">Select Year first</option>';
        secSelect.disabled = true;
      }
    } else if (triggerType === "year") {
      if (secSelect) {
        let secHtml = '<option value="">Select Section</option>';
        const yearVal = yearSelect ? yearSelect.value : "";
        if (dept && yearVal) {
          try {
            const sectionsMap = typeof dept.sections === 'string' ? JSON.parse(dept.sections) : (dept.sections || {});
            const yearSections = sectionsMap[yearVal] || [];
            yearSections.forEach(sec => {
              secHtml += `<option value="${sec}">${sec}</option>`;
            });
            secSelect.disabled = false;
          } catch (e) {
            console.error("Sec parse error", e);
            secSelect.disabled = false; // Fallback if parse fails but we have a dept
          }
        } else {
          secSelect.disabled = true;
        }
        secSelect.innerHTML = secHtml;
      }
    }
  }

  // ===== Utility: Create Modal =====
  function createModal(title, contentHTML, submitCallback, options = {}) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal-content";
    if (options.maxWidth) modal.style.maxWidth = options.maxWidth;

    modal.innerHTML = `
      <button class="modal-close-x" style="position:absolute; top:25px; right:30px; background:#f1f5f9; border:none; width:36px; height:36px; border-radius:100px; color:#64748b; font-size:20px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:0.2s; z-index:100;">×</button>
      <h3>${title}</h3>
      <div class="modal-body-scroll">${contentHTML}</div>
      <div class="modal-message" id="modalMsg"></div>`;

    modal.querySelector(".modal-close-x").onclick = () => document.body.removeChild(overlay);

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cancel-btn";
    cancelBtn.textContent = options.cancelText || "Cancel";
    cancelBtn.onclick = () => document.body.removeChild(overlay);

    const submitBtn = document.createElement("button");
    submitBtn.className = "submit-btn";
    submitBtn.id = "modalSubmitBtn";
    submitBtn.textContent = options.submitText || "Save Changes";
    if (options.hideSubmit) submitBtn.style.display = "none";
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
  function openQuestionEditor(quiz, allQuestions, startIndex = 0, sectionId = null) {
    let currentIndex = startIndex;
    const isNew = startIndex === -1;

    const editorHTML = `
      <div style="display:block; width:100%;">
        <div id="editorContent" style="width:100%;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #f1f5f9;">
            <div style="font-size:12px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Question Configuration</div>
            <button id="topExitBtn" class="btn-premium btn-secondary-outline" style="padding:8px 15px; font-size:11px; height:auto;">← Back to Library</button>
          </div>
          
          <label class="input-label">Question Type</label>
          <select id="qType" style="margin-bottom:15px; width:100%; height:45px; border-radius:10px; border:2px solid #e2e8f0; padding:0 15px; font-weight:600;">
             <option value="MCQ">Multiple Choice</option>
             <option value="NUMERICAL">Numerical Answer (JEE/GATE Style)</option>
             <option value="CODING">Coding Question (Java/C/C++/Python)</option>
          </select>
        
          <label class="input-label">Question Text</label>
          <textarea id="edText" style="min-height:100px;"></textarea>
          
          <label class="input-label">Question Image (Optional)</label>
          <input type="file" id="edImg" accept="image/*" style="margin-bottom:15px;">
          <div id="edImgPreview" style="margin-bottom:20px; max-height:150px; overflow:hidden; border-radius:8px; display:none;"></div>

          <div id="mcqSection">
              <label class="input-label">Options (Mark correct answer)</label>
              <div id="edOptList"></div>
              <button id="edAddOpt" class="add-opt-btn" style="padding:10px; font-size:13px; margin-bottom:20px;">+ Add Option</button>
          </div>
          <div id="numericalSection" style="display:none;">
               <label class="input-label">Correct Numerical Answer</label>
               <input type="number" id="edNumAns" step="any" placeholder="e.g. 5.5 or -10" style="margin-bottom:20px;">
               <p style="font-size:12px; color:var(--text-muted); margin-top:-15px; margin-bottom:20px;">Enter the exact numerical value correct for this question.</p>
          </div>

          <div id="codingSection" style="display:none;">
               <h3 style="color:var(--primary); margin-top:10px; margin-bottom:20px; font-size:16px; border-bottom:2px solid #eee; padding-bottom:10px;">Coding Question Details</h3>
               <label class="input-label">Input Format</label>
               <textarea id="edInputFormat" placeholder="e.g. First line contains N..."></textarea>
               
               <label class="input-label">Output Format</label>
               <textarea id="edOutputFormat" placeholder="e.g. Print the sum of even..."></textarea>
               
               <label class="input-label">Sample Test Cases (Visible to Students)</label>
               <div id="edSampleList" style="display:grid; gap:10px; margin-bottom:10px;"></div>
               <button id="edAddSample" class="add-opt-btn" style="padding:6px 12px; font-size:11px; margin-bottom:20px; background:#f0fdf4; color:#166534; border:1px solid #bbf7d0;">+ Add Sample Case</button>

               <div class="input-group-row">
                  <div>
                      <label class="input-label">Constraints</label>
                      <textarea id="edConstraints" style="min-height:80px;" placeholder="e.g. 1 <= N <= 10^5"></textarea>
                  </div>
                  <div>
                      <label class="input-label">Hints (Optional)</label>
                      <textarea id="edHints" style="min-height:80px;" placeholder="e.g. Use hash map for O(N)..."></textarea>
                  </div>
               </div>

               <label class="input-label">Hidden Test Cases (Evaluated on Submit)</label>
               <div id="edTestCaseList" style="display:grid; gap:15px; margin-bottom:15px;"></div>
               <button id="edAddTestCase" class="add-opt-btn" style="padding:8px 15px; font-size:12px; margin-bottom:20px;">+ Add Hidden Test Case</button>
          </div>
          
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
      </div>
    `;

    const modal = createModal(
      isNew ? "Add New Question" : "Edit Question",
      editorHTML,
      (m, o) => saveQuestion(m, o),
      { submitText: "Save Question", cancelText: "Close Editor", maxWidth: "950px" }
    );

    // Sidebar instructions removed

    // Wire up the new Top Exit button
    const topExit = modal.querySelector("#topExitBtn");
    if (topExit) {
      topExit.onclick = () => modal.querySelector(".modal-close-x").click();
    }

    // Default init

    const qType = modal.querySelector("#qType");
    const edText = modal.querySelector("#edText");
    const edOptList = modal.querySelector("#edOptList");
    const edMarks = modal.querySelector("#edMarks");
    const edNeg = modal.querySelector("#edNeg");
    const edTime = modal.querySelector("#edTime");
    const edNumAns = modal.querySelector("#edNumAns");
    const mcqSection = modal.querySelector("#mcqSection");
    const numericalSection = modal.querySelector("#numericalSection");
    const codingSection = modal.querySelector("#codingSection");

    const qCounter = modal.querySelector("#qCounter");
    const prevBtn = modal.querySelector("#prevQ");
    const nextBtn = modal.querySelector("#nextQ");

    qType.addEventListener("change", (e) => {
      // Permission Checks - Only if user initiated (e.isTrusted)
      // This prevents the modal from popping up when loading existing questions programmatically.
      if (e && e.isTrusted) {
        if (qType.value === "CODING" && !checkFeature("allowCoding", "Coding Questions")) {
          qType.value = "MCQ";
        }
        if (qType.value === "NUMERICAL" && !checkFeature("allowNumeric", "Numeric Questions")) {
          qType.value = "MCQ";
        }
      }

      mcqSection.style.display = "none";
      numericalSection.style.display = "none";
      codingSection.style.display = "none";

      if (qType.value === "NUMERICAL") {
        numericalSection.style.display = "block";
      } else if (qType.value === "CODING") {
        codingSection.style.display = "block";
      } else {
        mcqSection.style.display = "block";
      }
    });

    // Image Upload Permission
    const qImgInput = modal.querySelector("#edImg");
    if (qImgInput) {
      qImgInput.onclick = (e) => {
        if (!checkFeature("allowImages", "Image Uploads")) {
          e.preventDefault();
        }
      };
    }

    // Sub-elements for coding
    const edInputFormat = modal.querySelector("#edInputFormat");
    const edOutputFormat = modal.querySelector("#edOutputFormat");
    const edSampleList = modal.querySelector("#edSampleList");
    const edConstraints = modal.querySelector("#edConstraints");
    const edHints = modal.querySelector("#edHints");
    const edTestCaseList = modal.querySelector("#edTestCaseList");
    const edAddTestCase = modal.querySelector("#edAddTestCase");

    edAddTestCase.onclick = () => addTestCaseRow();

    function renderCurrent() {
      if (currentIndex === -1) {
        qType.value = "MCQ"; qType.dispatchEvent(new Event('change'));
        edText.value = ""; edOptList.innerHTML = ""; edNumAns.value = "";
        edInputFormat.value = ""; edOutputFormat.value = "";
        edSampleList.innerHTML = "";
        edConstraints.value = ""; edHints.value = "";
        edTestCaseList.innerHTML = "";
        addSampleRow();
        edMarks.value = 1; edNeg.value = 0; edTime.value = "";
        qCounter.textContent = "New Question Entry";
        prevBtn.style.display = nextBtn.style.display = "none";
        addOptionRow(); addOptionRow();
        return;
      }

      const q = allQuestions[currentIndex];
      qType.value = q.questionType || "MCQ";
      qType.dispatchEvent(new Event('change'));

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

      // Handle Content based on Type
      if (qType.value === "NUMERICAL") {
        edNumAns.value = q.options?.correctOption || "";
      } else if (qType.value === "CODING") {
        edInputFormat.value = q.inputFormat || "";
        edOutputFormat.value = q.outputFormat || "";
        edConstraints.value = q.constraints || "";
        edHints.value = q.hints || "";

        edSampleList.innerHTML = "";
        try {
          // If sampleInput starts with [, treat as JSON array, otherwise migrate old single sample
          let samples = [];
          if (q.sampleInput && q.sampleInput.startsWith("[")) {
            samples = JSON.parse(q.sampleInput);
          } else if (q.sampleInput || q.sampleOutput) {
            samples = [{ input: q.sampleInput, output: q.sampleOutput }];
          }
          samples.forEach(s => addSampleRow(s.input, s.output));
        } catch (e) {
          console.error("Sample parse error", e);
          addSampleRow(q.sampleInput, q.sampleOutput);
        }
        if (edSampleList.children.length === 0) addSampleRow();

        edTestCaseList.innerHTML = "";
        try {
          const tcs = JSON.parse(q.testCases || "[]");
          tcs.forEach(tc => addTestCaseRow(tc.input, tc.output));
        } catch (e) { console.error("Test case parse error", e); }
        if (edTestCaseList.children.length === 0) addTestCaseRow();
      } else {
        edOptList.innerHTML = "";
        const correctOnes = (q.options?.correctOption || "").split(",").map(s => s.trim());
        const choiceImgs = q.options?.choiceImages || [];
        (q.options?.choices || []).forEach((choice, idx) => addOptionRow(choice, correctOnes.includes(choice), choiceImgs[idx]));
      }
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

    function addTestCaseRow(input = "", output = "") {
      const row = document.createElement("div");
      row.style.cssText = "background:#f8fafc; padding:15px; border-radius:10px; border:1px solid #e2e8f0; position:relative;";
      row.innerHTML = `
        <button class="remove-opt-btn" style="position:absolute; top:10px; right:10px; margin:0;">×</button>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
          <div>
            <label style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:5px; display:block;">Input</label>
            <textarea class="tc-input" style="min-height:60px; font-family:monospace; font-size:12px;" placeholder="e.g. 5\\n1 2 3 4 5">${input}</textarea>
          </div>
          <div>
            <label style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:5px; display:block;">Expected Output</label>
            <textarea class="tc-output" style="min-height:60px; font-family:monospace; font-size:12px;" placeholder="e.g. 15">${output}</textarea>
          </div>
        </div>
      `;
      row.querySelector(".remove-opt-btn").onclick = () => row.remove();
      edTestCaseList.appendChild(row);
    }

    function addSampleRow(input = "", output = "") {
      const row = document.createElement("div");
      row.className = "sample-row";
      row.style.cssText = "background:#f0f9ff; padding:12px; border-radius:8px; border:1px solid #bae6fd; position:relative;";
      row.innerHTML = `
        <button class="remove-opt-btn" style="position:absolute; top:8px; right:8px; margin:0;">×</button>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div>
            <label style="font-size:10px; font-weight:800; color:#0369a1; text-transform:uppercase; margin-bottom:4px; display:block;">Sample Input</label>
            <textarea class="sample-input" style="min-height:50px; font-family:monospace; font-size:11px;" placeholder="e.g. 5">${input}</textarea>
          </div>
          <div>
            <label style="font-size:10px; font-weight:800; color:#0369a1; text-transform:uppercase; margin-bottom:4px; display:block;">Sample Output</label>
            <textarea class="sample-output" style="min-height:50px; font-family:monospace; font-size:11px;" placeholder="e.g. 15">${output}</textarea>
          </div>
        </div>
      `;
      row.querySelector(".remove-opt-btn").onclick = () => row.remove();
      edSampleList.appendChild(row);
    }

    async function saveQuestion(m, o, silent = false) {
      const type = qType.value;
      const choices = []; const correct = []; const choiceImages = [];
      const txt = edText.value.trim();

      if (type === "MCQ") {
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

        if (!txt || choices.length < 2 || !correct.length) {
          if (!silent) showMsg(m, "Required: text, 2+ options, & 1+ correct.", "error");
          return Promise.reject();
        }
      } else if (type === "NUMERICAL") {
        const ans = edNumAns.value.trim();
        if (!txt || !ans) {
          if (!silent) showMsg(m, "Required: text and correct answer.", "error");
          return Promise.reject();
        }
        correct.push(ans);
      } else if (type === "CODING") {
        if (!txt) {
          if (!silent) showMsg(m, "Question text is required.", "error");
          return Promise.reject();
        }
        // collect samples
        const sampleArr = [];
        for (const row of m.querySelectorAll("#edSampleList > div")) {
          const inp = row.querySelector(".sample-input").value.trim();
          const outp = row.querySelector(".sample-output").value.trim();
          if (inp || outp) sampleArr.push({ input: inp, output: outp });
        }
        if (sampleArr.length === 0) {
          if (!silent) showMsg(m, "At least one sample test case is required.", "error");
          return Promise.reject();
        }
        var sampleData = JSON.stringify(sampleArr);

        // collect test cases
        const tcArr = [];
        for (const row of m.querySelectorAll("#edTestCaseList > div")) {
          const inp = row.querySelector(".tc-input").value.trim();
          const outp = row.querySelector(".tc-output").value.trim();
          if (inp || outp) tcArr.push({ input: inp, output: outp });
        }
        var testCasesData = JSON.stringify(tcArr);
        correct.push("CODING_TASK");
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
        questionText: txt,
        questionType: type,
        options: choices,
        correctOption: correct.join(","),
        marks: edMarks.value,
        negativeMarks: edNeg.value,
        timeLimit: edTime.value || null,
        questionImage: qImageData,
        choiceImages: choiceImages,
        inputFormat: edInputFormat.value,
        outputFormat: edOutputFormat.value,
        sampleInput: (type === "CODING") ? sampleData : null,
        sampleOutput: (type === "CODING") ? "JSON_ARRAY" : null,
        constraints: edConstraints.value,
        hints: edHints.value,
        testCases: (type === "CODING") ? testCasesData : null
      };

      const qId = currentIndex >= 0 ? allQuestions[currentIndex].questionId : null;
      let url = isNew ? `/quiz/${quiz.id}/questions/add` : `/quiz/questions/${qId}`;
      if (isNew && sectionId) {
        url = `/quiz/sections/${sectionId}/questions/add`;
      }
      const method = isNew ? "POST" : "PUT";

      return authFetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(async r => {
        if (r.ok) {
          if (!silent) {
            showMsg(m, "Saved!");
            setTimeout(() => { o.remove(); if (window.refreshCurrentQuizSections) window.refreshCurrentQuizSections(); else openManageQuestions(quiz); }, 1000);
          }
          return r.json();
        } else {
          showMsg(m, "Save error.", "error");
          throw "error";
        }
      });
    }

    modal.querySelector("#edAddOpt").onclick = () => addOptionRow();
    if (modal.querySelector("#edAddSample")) modal.querySelector("#edAddSample").onclick = () => addSampleRow();
    if (modal.querySelector("#edAddTestCase")) modal.querySelector("#edAddTestCase").onclick = () => addTestCaseRow();
    prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; renderCurrent(); } };
    nextBtn.onclick = () => { if (currentIndex < allQuestions.length - 1) { currentIndex++; renderCurrent(); } };

    renderCurrent();
  }

  // ===== 3.5 Section Editor =====
  function openSectionEditor(quiz, section = null, callback) {
    const isNew = !section;
    const html = `
      <label class="input-label">Section Name</label>
      <input type="text" id="secName" value="${section ? section.sectionName : ''}" placeholder="e.g. Physics, Aptitude, etc.">
      <label class="input-label">Description (Optional)</label>
      <input type="text" id="secDesc" value="${section ? section.description : ''}" placeholder="Short description of this section">
    `;

    createModal(isNew ? "Add New Section" : "Edit Section", html, (m, o) => {
      const name = m.querySelector("#secName").value.trim();
      const desc = m.querySelector("#secDesc").value.trim();
      if (!name) return showMsg(m, "Section name is required", "error");

      const url = `/quiz/${quiz.id}/sections?name=${encodeURIComponent(name)}&description=${encodeURIComponent(desc)}`;
      authFetch(url, { method: "POST" }).then(async r => {
        if (r.ok) {
          showMsg(m, "Section saved!");
          setTimeout(() => { o.remove(); if (callback) callback(); }, 1000);
        } else showMsg(m, await r.text(), "error");
      });
    }, { submitText: "Save Section" });
  }

  // ===== 3.6 Import from Bank =====
  // ===== 3.6 Import from Bank =====
  function openBankImportModal(quiz, callback, sectionId = null) {
    const html = `
      <div style="display:flex; flex-direction:column; height:80vh;">
      
        <!-- 1. Selection & Filters -->
        <div style="padding:0 0 20px; border-bottom:1px solid #e2e8f0; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px;">
        
            <!-- Target Section -->
            <div id="targetSecContainer">
                 <label class="input-label">Target Section</label>
                 <select id="bTargetSec" style="height:45px;"><option value="">General (No Section)</option></select>
            </div>
            
            <!-- Company -->
            <div>
                 <label class="input-label">Company</label>
                 <select id="bCompany" style="height:45px;"><option value="">Loading...</option></select>
            </div>
            
            <!-- Category -->
            <div>
                 <label class="input-label">Category</label>
                 <select id="bCategory" style="height:45px;">
                    <option value="">Select Category</option>
                    <option value="CODING">Coding</option>
                    <option value="APTITUDE">Aptitude</option>
                    <option value="VERBAL">Verbal</option>
                 </select>
            </div>

             <!-- Topic -->
            <div>
                 <label class="input-label">Topic</label>
                 <select id="bTopic" style="height:45px;"><option value="">Select Topic</option></select>
            </div>

             <!-- Difficulty -->
            <div>
                 <label class="input-label">Difficulty</label>
                 <select id="bDiff" style="height:45px;">
                    <option value="">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                 </select>
            </div>
            
             <!-- Search Button -->
            <div style="display:flex; align-items:flex-end;">
                 <button id="bSearchBtn" class="btn-premium btn-primary-grad" style="height:45px; width:100%;">Search Bank</button>
            </div>
        </div>

        <!-- 2. Results List -->
        <div id="bResultsArea" style="flex:1; overflow-y:auto; padding:20px 0; min-height:0;">
             <div style="text-align:center; color:#94a3b8; padding:50px;">Select filters and search to populate questions.</div>
        </div>
        
      </div>
    `;

    const modal = createModal("Import from Question Bank", html, async (m, o) => {
      // Import Action
      const checkboxes = [...m.querySelectorAll(".bank-q-check:checked")];
      if (checkboxes.length === 0) return showMsg(m, "No questions selected.", "error");

      const bankIds = checkboxes.map(c => c.value);
      const secId = sectionId ? sectionId : (m.querySelector("#bTargetSec").value || null);

      const btn = m.querySelector("#modalSubmitBtn");
      const originalText = btn.textContent;
      btn.disabled = true; btn.textContent = "Importing...";

      try {
        const res = await authFetch("/api/bank/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: quiz.id, sectionId: secId, bankIds: bankIds })
        });

        if (res.ok) {
          showMsg(m, `Successfully imported ${bankIds.length} questions!`);
          setTimeout(() => { o.remove(); if (callback) callback(); }, 1500);
        } else {
          throw new Error(await res.text());
        }
      } catch (e) {
        showMsg(m, e.message || "Import failed", "error");
        btn.disabled = false; btn.textContent = originalText;
      }

    }, { submitText: "Import Selected", maxWidth: "1000px" });

    // --- Logic ---
    const bTargetSec = modal.querySelector("#bTargetSec");
    const bCompany = modal.querySelector("#bCompany");
    const bCategory = modal.querySelector("#bCategory");
    const bTopic = modal.querySelector("#bTopic");
    const bDiff = modal.querySelector("#bDiff");
    const bSearch = modal.querySelector("#bSearchBtn");
    const resArea = modal.querySelector("#bResultsArea");
    const targetSecContainer = modal.querySelector("#targetSecContainer");

    // 1. Load Sections
    if (sectionId) {
      targetSecContainer.style.display = "none";
    } else {
      authFetch(`/quiz/${quiz.id}/sections`).then(r => r.json()).then(secs => {
        secs.forEach(s => {
          const opt = document.createElement("option");
          opt.value = s.id; opt.textContent = s.sectionName;
          bTargetSec.appendChild(opt);
        });
      });
    }

    // 2. Load Companies
    authFetch("/api/bank/companies").then(r => r.json()).then(comps => {
      bCompany.innerHTML = '<option value="">Select Company</option>' + comps.map(c => `<option value="${c}">${c}</option>`).join("");
    }).catch(e => bCompany.innerHTML = '<option value="">Error loading</option>');

    // 3. Category Change -> Load Topics
    bCategory.addEventListener("change", () => {
      const cat = bCategory.value;
      if (!cat) { bTopic.innerHTML = '<option value="">Select Topic</option>'; return; }

      authFetch(`/api/bank/topics?category=${cat}`).then(r => r.json()).then(tops => {
        bTopic.innerHTML = '<option value="">Select Topic</option>' + tops.map(t => `<option value="${t}">${t}</option>`).join("");
      });
    });

    // 4. Search
    bSearch.addEventListener("click", () => {
      const comp = bCompany.value;
      const cat = bCategory.value;
      const top = bTopic.value;
      const diff = bDiff.value;

      if (!comp || !cat) return showMsg(modal, "Company and Category are required.", "error");

      resArea.innerHTML = '<div class="loading-spinner" style="margin:50px auto;"></div>';

      let url = `/api/bank/filter?company=${encodeURIComponent(comp)}&category=${encodeURIComponent(cat)}`;
      if (top) url += `&topic=${encodeURIComponent(top)}`;
      if (diff) url += `&difficulty=${encodeURIComponent(diff)}`;

      authFetch(url).then(r => r.json()).then(data => {
        if (data.length === 0) {
          resArea.innerHTML = `<div style="text-align:center; padding:50px; color:#64748b;">No questions found for these filters.</div>`;
          return;
        }

        resArea.innerHTML = data.map(q => `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:15px; margin-bottom:10px; display:flex; gap:15px; align-items:flex-start;">
                    <input type="checkbox" class="bank-q-check" value="${q.id}" style="mt-1; width:18px; height:18px; cursor:pointer;">
                    <div style="flex:1;">
                        <div style="margin-bottom:5px;">
                            <span class="badge" style="background:${q.difficulty === 'Easy' ? '#d1fae5' : q.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2'}; color:${q.difficulty === 'Easy' ? '#065f46' : q.difficulty === 'Medium' ? '#92400e' : '#991b1b'};">${q.difficulty || 'N/A'}</span>
                            <span class="badge" style="background:#e0f2fe; color:#0369a1;">${q.topic || 'General'}</span>
                            <span class="badge" style="background:#f3e8ff; color:#6b21a8;">${q.questionType}</span>
                        </div>
                        <div style="font-weight:600; color:#334155; font-size:14px; font-family:'Consolas', monospace; white-space:pre-wrap;">${q.questionText}</div>
                    </div>
                </div>
            `).join("");
      }).catch(e => {
        resArea.innerHTML = `<div style="text-align:center; color:#ef4444; padding:50px;">Error fetching questions.</div>`;
      });
    });
  }

  // ===== 4. Manage Questions Home (With Sections) =====
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
          <button id="addQDirectBtn" class="btn-premium btn-secondary-outline">+ Add Question</button>

          <div id="globalImportBtnWrapper" style="display:inline-block;">
             <button id="importBankBtn" class="btn-premium btn-secondary-outline" style="background:#f0f9ff; color:#0284c7; border-color:#bae6fd;">Import from Bank</button>
          </div>
          <button id="addSectionBtn" class="btn-premium btn-primary-grad">+ Add Section</button>
          <button id="backHome" class="btn-premium btn-secondary-outline">Back to Library</button>
        </div>
      </div>
      <div class="manage-body" id="sectionsContainer">
         <div id="generalQuestionsArea" style="margin-bottom: 40px; display:none;">
            <div class="section-header" style="background:#fff7ed; border-color:#fed7aa;">
               <div class="section-title-area">
                  <h3 style="color:#ea580c;">General Questions</h3>
                  <p>Questions not assigned to any specific section.</p>
               </div>
            </div>
            <div class="section-body" style="background:#fffcf9;">
               <div id="mixedQList" class="questions-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap:25px;"></div>
            </div>
         </div>
         <div id="sectionListArea">
            <div style="text-align:center; padding:50px;"><div class="loading-spinner"></div></div>
         </div>
      </div>
    `;
    facultyContainer.appendChild(ui);

    const loadSections = () => {
      // Re-fetch quiz or just use existing. For fresh state, we re-fetch some.
      const fetchSections = authFetch(`/quiz/${quiz.id}/sections`).then(r => r.json());
      const fetchAllQs = authFetch(`/quiz/${quiz.id}/questions`).then(r => r.json());

      Promise.all([fetchSections, fetchAllQs]).then(([sections, allQs]) => {
        const sectionArea = ui.querySelector("#sectionListArea");
        const generalArea = ui.querySelector("#generalQuestionsArea");
        const mixedQList = ui.querySelector("#mixedQList");
        const addQDirectBtn = ui.querySelector("#addQDirectBtn");

        const mixedQs = allQs.filter(q => !q.sectionId && !q.section);
        const hasSections = sections && sections.length > 0;

        // Rule: Show General Questions if there are questions not assigned to any section
        if (mixedQs.length > 0) {
          generalArea.style.display = "block";
          mixedQList.innerHTML = "";
          renderQuestionCards(mixedQs, mixedQList, quiz, loadSections);
        } else {
          generalArea.style.display = "none";
        }

        // Rule: Show top direct-add button only if NO sections exist (force usage of section-specific add if sections exist)
        if (hasSections) {
          addQDirectBtn.style.display = "none";
          ui.querySelector("#globalImportBtnWrapper").style.display = "none"; // Hide global import if sections exist
        } else {
          addQDirectBtn.style.display = "inline-flex";
          ui.querySelector("#globalImportBtnWrapper").style.display = "inline-block";
        }

        if (!hasSections) {
          // Check if we have unassigned questions to decide whether to show the empty state
          const unassignedQsCount = allQs.filter(q => !q.sectionId && !q.section).length;
          sectionArea.innerHTML = unassignedQsCount > 0 ? "" : `
            <div style="text-align:center; padding:100px; background:white; border-radius:24px; border:2px dashed var(--border);">
              <div style="font-size:60px; margin-bottom:20px;">📦</div>
              <h3 style="font-weight:900;">Organize Your Exam</h3>
              <p style="color:var(--text-muted); font-weight:600;">You can add questions directly or create sections for better structure.</p>
              <div style="display:flex; justify-content:center; gap:20px; margin-top:20px;">
                <button class="btn-premium btn-secondary-outline" onclick="document.getElementById('addQDirectBtn').click()">Add Direct Question</button>
                <button class="btn-premium btn-primary-grad" onclick="document.getElementById('addSectionBtn').click()">Create Section</button>
              </div>
            </div>`;
          return;
        }

        sectionArea.innerHTML = "";
        sections.forEach(sec => {
          const secWrap = document.createElement("div");
          secWrap.className = "section-wrapper";
          secWrap.innerHTML = `
            <div class="section-header">
              <div class="section-title-area">
                <h3>${sec.sectionName}</h3>
                <p>${sec.description || 'No description provided'}</p>
              </div>
              <div class="section-actions">
                <button class="btn-premium btn-primary-grad add-q-to-sec" style="padding: 8px 16px; font-size:12px;">+ Add Question</button>
                <button class="btn-premium btn-secondary-outline import-bank-sec" style="padding: 8px 16px; font-size:12px; background:#f0f9ff; color:#0284c7; border-color:#bae6fd;">Import from Bank</button>
                <button class="delete-btn delete-sec" style="padding: 8px 16px; font-size:12px;">Delete Section</button>
              </div>
            </div>
            <div class="section-body">
              <div class="questions-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap:25px;">
                 ${(sec.questions || []).length === 0 ? '<div class="empty-section-msg" style="grid-column: 1/-1;">No questions in this section.</div>' : ''}
              </div>
            </div>
          `;

          const qList = secWrap.querySelector(".questions-list");
          renderQuestionCards(sec.questions || [], qList, quiz, loadSections, sec.id);

          secWrap.querySelector(".add-q-to-sec").onclick = () => openQuestionEditor(quiz, [], -1, sec.id);
          secWrap.querySelector(".import-bank-sec").onclick = () => { if (checkFeature("allowQuestionBank", "Question Bank Access")) openBankImportModal(quiz, loadSections, sec.id); };
          secWrap.querySelector(".delete-sec").onclick = async () => {
            const confirmed = await showConfirm(`CRITICAL: This will delete the section "${sec.sectionName}" AND all ${sec.questions?.length || 0} questions within it. This cannot be undone. Proceed?`, "Danger: Permanent Deletion");
            if (confirmed) {
              authFetch(`/quiz/sections/${sec.id}`, { method: "DELETE" }).then(async r => {
                if (r.ok) {
                  loadSections();
                  showAlert("Section Deleted Successfully", "Success", "🗑️");
                }
                else {
                  const errText = await r.text();
                  showAlert("Failed to delete section: " + errText);
                }
              }).catch(e => showAlert("Connection error while deleting section."));
            }
          };

          sectionArea.appendChild(secWrap);
        });
      }).catch(err => {
        ui.querySelector("#sectionListArea").innerHTML = `<div style="color:red; text-align:center;">Failed to load data.</div>`;
      });
    };

    function renderQuestionCards(qs, listElement, quizInfo, reloadFn, sectionId = null) {
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
        card.onclick = async (e) => {
          if (e.target.classList.contains('small-delete-btn')) {
            const confirmed = await showConfirm("Delete this question?");
            if (confirmed) {
              authFetch(`/quiz/questions/${q.questionId}`, { method: "DELETE" }).then(r => {
                if (r.ok) {
                  reloadFn();
                  showAlert("Question Deleted", "Success", "🗑️");
                }
              });
            }
            return;
          }
          openQuestionEditor(quizInfo, qs, i, sectionId);
        };
        listElement.appendChild(card);
      });
    }

    loadSections();

    ui.querySelector("#addQDirectBtn").onclick = () => openQuestionEditor(quiz, [], -1, null);
    ui.querySelector("#importBankBtn").onclick = () => { if (checkFeature("allowQuestionBank", "Question Bank Access")) openBankImportModal(quiz, loadSections); };
    ui.querySelector("#addSectionBtn").onclick = () => openSectionEditor(quiz, null, loadSections);
    ui.querySelector("#backHome").onclick = () => {
      ui.remove();
      const myUI = document.getElementById("myExamsUI");
      if (myUI) myUI.classList.remove("hidden"); else facultyDashboard.classList.remove("hidden");
    };

    // Override the reload behavior of openManageQuestions in other functions if needed
    window.refreshCurrentQuizSections = loadSections;
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
        card.querySelector(".delete-quiz-btn").onclick = async () => {
          const confirmed = await showConfirm(`Delete quiz "${ex.quizName}"?`);
          if (confirmed) {
            authFetch(`/quiz/${ex.id}`, { method: "DELETE" }).then(r => {
              if (r.ok) {
                refreshExamsList(ui);
                showAlert("Exam Deleted", "Success", "🗑️");
              }
            });
          }
        };
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
            <label class="input-label" style="margin:0 0 8px;">Department</label>
            <select id="fDept" class="dept-select-dynamic" style="margin:0; height:50px;">
              <option value="">All Departments</option>
              ${departmentsListHTML}
            </select>
          </div>
          <div class="filter-item">
            <label class="input-label" style="margin:0 0 8px;">Year</label>
            <select id="fYear" class="year-select-dynamic" disabled style="margin:0; height:50px;"><option value="">All Years</option></select>
          </div>
          <div class="filter-item">
            <label class="input-label" style="margin:0 0 8px;">Section</label>
            <select id="fSec" class="section-select-dynamic" disabled style="margin:0; height:50px;"><option value="">All Sections</option></select>
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
      const q = resUI.querySelector("#fId").value; if (!q) return showAlert("Please enter a Quiz ID to search.");
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
            <td style="padding:15px 20px;"><span style="background:${r.rank ? 'var(--primary)' : '#94a3b8'}; color:white; width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px;">${r.rank ? '#' + r.rank : 'N/A'}</span></td>
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
      const q = resUI.querySelector("#fId").value; if (!q) return showAlert("Quiz ID is required for Excel export.");
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
        .catch(e => showAlert(e.message))
        .finally(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
        });
    };
    resUI.querySelector("#closeRes").onclick = () => { resUI.remove(); facultyDashboard.classList.remove("hidden"); };

    // Setup dynamic listeners for the newly added results UI
    attachDynamicListeners(resUI.querySelector(".filter-panel"));
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
      if (!roll) return showAlert("Please enter a Student Roll Number");

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
        showAlert("Integrity Error: " + e.message);
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
    const html = `
      <label class="input-label">Quiz ID</label>
      <div style="display:flex; gap:10px;">
        <input type="number" id="aI" placeholder="Enter Quiz ID" style="flex:1;">
        <button id="loadConfigBtn" class="btn-premium btn-secondary-outline" style="padding:0 15px;">Fetch Details</button>
      </div>
      
      <div id="activationConfigArea" style="margin-top:20px; display:none;">
         <div class="input-group-row">
           <div>
             <label class="input-label">Dept</label>
             <select id="aD" class="dept-select-dynamic">
               <option value="">Select Department</option>
               ${departmentsListHTML}
             </select>
           </div>
           <div><label class="input-label">Year</label><select id="aY" class="year-select-dynamic" disabled><option value="">Select Year</option></select></div>
           <div><label class="input-label">Sec</label><select id="aS" class="section-select-dynamic" disabled><option value="">Select Section</option></select></div>
         </div>
         
         <div style="margin-top:20px; padding:15px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
            <h4 style="margin:0 0 10px; font-size:14px; color:var(--primary);">Random Question Settings</h4>
            <p style="font-size:11px; color:var(--text-muted); margin-bottom:15px;">Specify how many questions to pick randomly for each student. Leave 0 to pick all.</p>
            <div id="sectionCountsList"></div>
         </div>


         <div class="input-group-row" style="grid-template-columns: 1fr 1fr; margin-top:20px;">
            <div>
               <label class="input-label">Available From (Optional)</label>
               <input type="datetime-local" id="aSchedStart" style="height:45px; border-radius:10px; font-size:12px;">
            </div>
            <div>
               <label class="input-label">Available To (Optional)</label>
               <input type="datetime-local" id="aSchedEnd" style="height:45px; border-radius:10px; font-size:12px;">
            </div>
         </div>

         <div class="input-group-row" style="margin-top:10px; grid-template-columns: 1fr 1fr;">
            <div><label class="input-label">Exam duration (Mins)</label><input type="number" id="aDu" value="60"></div>
            <div><label class="input-label">Activation Mode</label><select id="aSt"><option value="true">Active (Enabled)</option><option value="false">Inactive (Disabled)</option></select></div>
         </div>
         
         <p style="font-size:11px; color:var(--text-muted); margin-top:10px;"><i>* If scheduled times are set, students can only enter during that window. If 'Inactive' is selected, the quiz is hidden regardless of schedule.</i></p>
      </div>
    `;

    const modal = createModal("Live Activation", html, (m, o) => {
      const quizId = m.querySelector("#aI").value;
      const section = m.querySelector("#aS").value;
      const dept = m.querySelector("#aD").value;
      const year = m.querySelector("#aY").value;
      const active = m.querySelector("#aSt").value;
      const duration = m.querySelector("#aDu").value;

      // Extract section configs and VALIDATE
      const configs = {};
      let isValid = true;
      let errorMsg = "";

      m.querySelectorAll(".sec-row-item").forEach(row => {
        const sid = row.dataset.id;
        const totalAvail = parseInt(row.dataset.total);
        const countInput = row.querySelector(".sec-count-input");
        const marksInput = row.querySelector(".sec-marks-input");

        const count = parseInt(countInput.value) || 0;
        const targetMarks = parseFloat(marksInput.value) || 0;
        const marksArray = JSON.parse(row.dataset.marks || "[]");

        if (count > totalAvail) {
          isValid = false;
          errorMsg = `Section "${row.dataset.name}": Trying to get more questions (${count}) than existing questions (${totalAvail}).`;
          return;
        }

        if (count > 0 && targetMarks > 0) {
          // Sort to find max/min possible for specific error Messaging
          const sorted = [...marksArray].sort((a, b) => b - a);
          const maxPossible = sorted.slice(0, count).reduce((a, b) => a + b, 0);
          const minPossible = sorted.slice(-count).reduce((a, b) => a + b, 0);

          if (targetMarks > maxPossible) {
            isValid = false;
            errorMsg = `Section "${row.dataset.name}": You requested ${targetMarks} marks, but the most I can get from any ${count} questions is ${maxPossible}. I can't accommodate that much marks for this section.`;
            return;
          }

          if (targetMarks < minPossible) {
            isValid = false;
            errorMsg = `Section "${row.dataset.name}": The minimum marks possible for ${count} questions is ${minPossible}. Your target of ${targetMarks} is too low.`;
            return;
          }

          if (!canSatisfyMarks(marksArray, count, targetMarks)) {
            isValid = false;
            errorMsg = `Section "${row.dataset.name}": I can't pick the questions for these marks according to the marks you gave to your questions.`;
            return;
          }
        }

        if (count > 0) {
          configs[sid] = { count, targetMarks };
        }
      });

      if (!isValid) return showFacultyNotice("Configuration Error", errorMsg, "error");

      const startTime = m.querySelector("#aSchedStart").value;
      const endTime = m.querySelector("#aSchedEnd").value;

      const configStr = encodeURIComponent(JSON.stringify(configs));
      const url = `/quiz/activate?quizId=${quizId}&section=${section}&department=${dept}&year=${year}&active=${active}&durationMinutes=${duration}&sectionConfigs=${configStr}&startTime=${startTime}&endTime=${endTime}`;

      authFetch(url, { method: "POST" }).then(async r => {
        if (r.ok) {
          const action = active === "true" ? "Activated" : "Deactivated";
          showFacultyNotice("Success", `Quiz ${action} Successfully!`, "success");
          setTimeout(() => o.remove(), 1500);
        } else {
          showFacultyNotice("Action Failed", await r.text(), "error");
        }
      });
    }, { hideSubmit: true, submitText: "Activate Assessment" });

    // Setup dynamic listeners for activation modal
    attachDynamicListeners(modal);

    // Helper: Subset sum variant to check if N elements can sum to T
    function canSatisfyMarks(marks, n, target) {
      // DP or recursive with memo
      const memo = new Map();
      function solve(idx, count, currentSum) {
        const key = `${idx}-${count}-${currentSum.toFixed(2)}`;
        if (memo.has(key)) return memo.get(key);

        if (count === n) {
          return Math.abs(currentSum - target) < 0.01;
        }
        if (idx === marks.length || count > n || currentSum > target + 1) return false;

        // Pick
        if (solve(idx + 1, count + 1, currentSum + marks[idx])) {
          memo.set(key, true);
          return true;
        }
        // Skip
        if (solve(idx + 1, count, currentSum)) {
          memo.set(key, true);
          return true;
        }

        memo.set(key, false);
        return false;
      }
      return solve(0, 0, 0);
    }

    const loadBtn = modal.querySelector("#loadConfigBtn");
    loadBtn.onclick = async () => {
      const qId = modal.querySelector("#aI").value;
      if (!qId) return showFacultyNotice("Required Field", "Please enter a valid Quiz ID to fetch configuration details.", "error");

      loadBtn.disabled = true;
      loadBtn.textContent = "...";

      try {
        const [secRes, qRes] = await Promise.all([
          authFetch(`/quiz/${qId}/sections`),
          authFetch(`/quiz/${qId}/questions`)
        ]);

        if (!secRes.ok || !qRes.ok) throw new Error();

        const sections = await secRes.json();
        const allQs = await qRes.json();

        const listArea = modal.querySelector("#sectionCountsList");
        listArea.innerHTML = `
          <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:10px; margin-bottom:10px; padding-bottom:5px; border-bottom:1px solid #ddd; font-size:10px; font-weight:800; text-transform:uppercase; color:#64748b;">
             <span>Section Name</span>
             <span>Qty</span>
             <span>Marks</span>
          </div>
        `;

        const renderRow = (id, name, qs) => {
          const mList = JSON.stringify(qs.map(q => q.marks));
          return `
            <div class="sec-row-item" data-id="${id}" data-total="${qs.length}" data-name="${name}" data-marks='${mList}' style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:10px; align-items:center; margin-bottom:8px;">
               <span style="font-size:12px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${name}">${name} (${qs.length})</span>
               <input type="number" class="sec-count-input" value="0" placeholder="Qty" style="width:100%; margin:0; padding:5px 8px; border-radius:8px;">
               <input type="number" class="sec-marks-input" value="0" placeholder="Marks" style="width:100%; margin:0; padding:5px 8px; border-radius:8px;">
            </div>
          `;
        };

        // General questions
        const orphaned = allQs.filter(q => !q.sectionId && !q.section);
        if (orphaned.length > 0) listArea.innerHTML += renderRow("-1", "General", orphaned);

        // Sections
        sections.forEach(sec => {
          listArea.innerHTML += renderRow(sec.id, sec.sectionName, sec.questions || []);
        });

        modal.querySelector("#activationConfigArea").style.display = "block";

        const submitBtn = modal.querySelector("#modalSubmitBtn");
        submitBtn.style.display = "inline-flex";

        const actionSelect = modal.querySelector("#aSt");
        if (actionSelect) {
          actionSelect.onchange = () => {
            submitBtn.textContent = actionSelect.value === "true" ? "Activate Assessment" : "Deactivate Assessment";
          };
          // Trigger once init
          actionSelect.onchange();
        }

      } catch (e) {
        showFacultyNotice("Sync Error", "Could not synchronize with quiz database. Please verify the Quiz ID.", "error");
      } finally {
        loadBtn.disabled = false;
        loadBtn.textContent = "Fetch";
      }
    };
  });

  publishResultBtn?.addEventListener("click", () => {
    loadDepartments();
    createModal("Publish Control",
      `<label class="input-label">Quiz ID</label><input type="number" id="pI">
       <div class="input-group-row">
         <div>
           <label class="input-label">Dept</label>
           <select id="pD" class="dept-select-dynamic">
             <option value="">Select Department</option>
             ${departmentsListHTML}
           </select>
         </div>
         <div><label class="input-label">Year</label><select id="pY" class="year-select-dynamic" disabled><option value="">Year</option></select></div>
         <div><label class="input-label">Sec</label><select id="pS" class="section-select-dynamic" disabled><option value="">Sec</option></select></div>
       </div>
       <label class="input-label">Action</label><select id="pSt"><option value="true">Publish</option><option value="false">Unpublish</option></select>`,
      (m, o) => {
        authFetch(`/quiz/${m.querySelector("#pI").value}/publish-result?section=${m.querySelector("#pS").value}&department=${m.querySelector("#pD").value}&year=${m.querySelector("#pY").value}&publish=${m.querySelector("#pSt").value}`, { method: "POST" })
          .then(async r => { showMsg(m, await r.text(), r.ok ? "success" : "error"); if (r.ok) setTimeout(() => o.remove(), 1500); });
      });

    // Use the recently created modal container to attach listeners
    const pModal = document.querySelector(".modal-overlay:last-child");
    if (pModal) attachDynamicListeners(pModal);
  });

  init();
})();
