(() => {
	const takeQuizBtn = document.getElementById("takeQuizBtn");
	const viewResultBtn = document.getElementById("viewResultBtn");
	const leftMenu = document.getElementById("leftMenu");

	let studentRoll = "";
	let currentExam = {
		active: false,
		questions: [],
		answers: {},
		currentIndex: 0,
		startTime: null,
		totalSeconds: 0,
		blurWarnings: 0,
		lockedQuestions: new Set(),
		visitedQuestions: new Set(), // Track which questions were viewed
		markedForReview: new Set(),
		timers: {}, // For per-question timing
		isConnectionStable: true
	};

	function getRoll() {
		if (studentRoll) return studentRoll;
		const user = JSON.parse(sessionStorage.getItem("user") || "{}");
		studentRoll = user.rollNumber || "";
		return studentRoll;
	}

	window.setStudentRoll = (roll) => {
		studentRoll = roll;
	};

	// -------------------- UTILITIES --------------------
	function hashString(str) {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash |= 0;
		}
		return Math.abs(hash); // Ensure positive seed
	}

	function shuffleArray(array, seed) {
		let arr = [...array];
		let random = function () {
			seed = (seed * 9301 + 49297) % 233280;
			return seed / 233280;
		};
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function formatTime(seconds) {
		if (seconds < 0) seconds = 0;
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	function showFacultyNotice(title, message, type = "info") {
		const overlay = document.createElement("div");
		overlay.className = "warning-overlay";
		overlay.style.zIndex = "20000";

		const icon = type === "error" ? "❌" : (type === "success" ? "✅" : "ℹ️");
		const color = type === "error" ? "#ef4444" : (type === "success" ? "#10b981" : "var(--primary)");

		overlay.innerHTML = `
      <div class="confirm-modal" style="max-width:450px; text-align:center; padding:40px;">
        <div style="font-size:60px; margin-bottom:20px;">${icon}</div>
        <h3 style="margin:0 0 15px; color:${color}; font-weight:900;">${title}</h3>
        <p style="color:var(--text-muted); font-weight:600; line-height:1.6; margin-bottom:30px;">${message}</p>
        <button class="exam-btn btn-next" style="width:100%; height:50px;">Understood</button>
      </div>
    `;
		document.body.appendChild(overlay);
		overlay.querySelector("button").onclick = () => overlay.remove();
	}

	function showModernModal(options) {
		const { title, body, icon, buttons, violationCount } = options;

		// Aggressively clear ALL potential modal overlays to prevent overlapping
		document.querySelectorAll(".warning-overlay, .modal-overlay, .custom-modal-overlay").forEach(m => m.remove());

		const overlay = document.createElement("div");
		overlay.className = "warning-overlay";
		overlay.innerHTML = `
			<div class="confirm-modal">
				${violationCount ? `<div class="violation-badge">⚠️ Violation ${violationCount} / 5</div>` : ""}
				${icon ? `<div style="font-size: 40px; margin-bottom: 15px;">${icon}</div>` : ""}
				<h2>${title}</h2>
				<p>${body}</p>
				<div class="modal-footer-btns">
					${buttons.map(btn => `<button class="exam-btn ${btn.className}" id="${btn.id}">${btn.text}</button>`).join("")}
				</div>
			</div>
		`;
		document.body.appendChild(overlay);

		buttons.forEach(btn => {
			overlay.querySelector(`#${btn.id}`).onclick = () => {
				overlay.remove();
				if (btn.callback) btn.callback();
			};
		});
		return overlay;
	}

	// -------------------- DASHBOARD LOGIC --------------------
	takeQuizBtn?.addEventListener("click", () => {
		const roll = getRoll();
		if (!roll) return alert("Please login first to access quizzes.");
		showBatchSelector();
	});

	function createBaseModal(title, contentHTML, submitText, callback) {
		const existing = document.getElementById("studentModalOverlay");
		if (existing) existing.remove();

		const overlay = document.createElement("div");
		overlay.id = "studentModalOverlay";
		overlay.className = "modal-overlay";
		overlay.innerHTML = `
      <div class="modal-content" id="studentModal" style="max-height: 90vh; overflow-y: auto;">
        <span class="close">&times;</span>
        <div class="modal-header" id="studentModalHeader" style="font-size: 1.5rem; color: var(--primary-purple); margin-bottom: 20px; font-weight: 700; border-bottom: 2px solid #f3e5f5; padding-bottom: 10px; text-align: center;">${title}</div>
        <div class="modal-body" id="studentModalBody">${contentHTML}</div>
        <div class="modal-footer" id="studentModalFooter" style="text-align: right; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
          ${submitText ? `<button class="primary-btn" id="modalSubmitBtn" style="width: auto; padding: 10px 30px;">${submitText}</button>` : ""}
        </div>
      </div>
    `;
		document.body.appendChild(overlay);
		overlay.querySelector(".close").onclick = () => overlay.remove();
		if (submitText) overlay.querySelector("#modalSubmitBtn").onclick = () => callback(overlay);
		return overlay;
	}

	// -------------------- UI COMPONENTS --------------------
	function createSimpleModal(content) {
		const existing = document.getElementById("quizModalOverlay");
		if (existing) existing.remove();

		const overlay = document.createElement("div");
		overlay.id = "quizModalOverlay";
		overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:9999;";

		const modal = document.createElement("div");
		modal.style.cssText = "background:white; padding:30px; border-radius:15px; max-width:800px; width:90%; max-height:80vh; overflow-y:auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);";
		modal.innerHTML = content;

		overlay.appendChild(modal);
		document.body.appendChild(overlay);

		// Event listener for closing
		const closeBtn = modal.querySelector("#closeSimpleModal");
		if (closeBtn) closeBtn.onclick = () => overlay.remove();

		return { overlay, modal };
	}

	async function showBatchSelector() {
		const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
		let currentRoll = userData.rollNumber || studentRoll || "";
		const currentDept = userData.department || "";
		const currentYear = userData.year || 1;
		const currentSection = userData.section || "A";

		if (!currentRoll) {
			currentRoll = getRoll();
			if (!currentRoll) return alert("Please login first.");
		}

		console.log("Student Roll:", currentRoll);

		const content = `
			<h2 style="margin:0 0 20px; color:#6a0dad; font-family:'Segoe UI', sans-serif;">Find Your Quizzes</h2>
			<div style="display:grid; gap:15px; margin-bottom:20px;">
				<div>
					<label style="display:block; margin-bottom:5px; font-weight:600; color:#333;">Department</label>
					<select id="qDept" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; background:white;">
						<option value="${currentDept}">${currentDept || 'Select Department'}</option>
					</select>
				</div>
				<div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
					<div>
						<label style="display:block; margin-bottom:5px; font-weight:600; color:#333;">Year</label>
						<select id="qYear" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; background:white;">
							${[1, 2, 3, 4].map(y => `<option value="${y}" ${currentYear == y ? 'selected' : ''}>Year ${y}</option>`).join("")}
						</select>
					</div>
					<div>
						<label style="display:block; margin-bottom:5px; font-weight:600; color:#333;">Section</label>
						<select id="qSection" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; background:white;">
							${["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map(s => `<option value="${s}" ${currentSection == s ? 'selected' : ''}>${s}</option>`).join('')}
						</select>
					</div>
				</div>
			</div>
			
			<div id="quizResultsArea"></div>

			<div style="display:flex; gap:10px; margin-top:20px; border-top: 1px solid #eee; padding-top: 20px;">
				<button id="fetchQuizzesBtn" style="flex:1; padding:12px; background:#6a0dad; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; transition: background 0.3s;">Fetch Quizzes</button>
				<button id="closeSimpleModal" style="padding:12px 20px; background:#f1f5f9; color:#334155; border:none; border-radius:5px; cursor:pointer; font-weight:600;">Close</button>
			</div>
		`;

		const { modal } = createSimpleModal(content);

		// Populate Departments
		try {
			const res = await authFetch("/departments");
			if (res.ok) {
				const depts = await res.json();
				const deptSelect = modal.querySelector("#qDept");
				if (deptSelect && depts && depts.length > 0) {
					deptSelect.innerHTML = depts.map(d => `<option value="${d.name}" ${currentDept === d.name ? 'selected' : ''}>${d.name}</option>`).join("");
				}
			}
		} catch (err) { console.error("Dept error", err); }

		// Fetch Logic
		const fetchBtn = modal.querySelector("#fetchQuizzesBtn");
		fetchBtn.onclick = async () => {
			const dept = modal.querySelector("#qDept").value;
			const year = modal.querySelector("#qYear").value;
			const section = modal.querySelector("#qSection").value;
			const resultsArea = modal.querySelector("#quizResultsArea");

			if (!dept) return alert("Please select a department");

			fetchBtn.textContent = "Loading...";
			fetchBtn.disabled = true;
			resultsArea.innerHTML = '<div style="text-align:center; padding:20px;">Using filters...</div>';

			try {
				const url = `/quiz/active?rollNumber=${encodeURIComponent(currentRoll)}&department=${encodeURIComponent(dept)}&year=${year}&section=${section}`;
				const res = await authFetch(url);
				if (!res.ok) throw new Error(await res.text());
				const quizzes = await res.json();

				renderSimpleQuizTable(quizzes, resultsArea, { dept, year, section });
			} catch (e) {
				resultsArea.innerHTML = `<div style="text-align:center; padding:15px; color:red;">Error: ${e.message}</div>`;
			} finally {
				fetchBtn.textContent = "Fetch Quizzes";
				fetchBtn.disabled = false;
			}
		};
	}

	function renderSimpleQuizTable(quizzes, container, meta) {
		if (!quizzes || quizzes.length === 0) {
			container.innerHTML = `<div style="text-align:center; padding:30px; color:#666; background:#f9f9f9; border-radius:10px;">No active quizzes found for the selected batch.</div>`;
			return;
		}

		container.innerHTML = `
			<table style="width:100%; border-collapse:collapse; margin-top:10px;">
				<thead>
					<tr style="background:#f1f5f9; color:#475569;">
						<th style="padding:12px; text-align:left; border-bottom:2px solid #e2e8f0; font-size:13px;">Quiz Detail</th>
						<th style="padding:12px; text-align:left; border-bottom:2px solid #e2e8f0; font-size:13px;">Faculty</th>
						<th style="padding:12px; text-align:center; border-bottom:2px solid #e2e8f0; font-size:13px;">Action</th>
					</tr>
				</thead>
				<tbody>
					${quizzes.filter(q => q && q.quiz).map(q => {
			// Escape strings for JS onclick call
			const qName = q.quiz.quizName.replace(/'/g, "\\'");
			const fName = (q.quiz.faculty?.facultyName || 'N/A').replace(/'/g, "\\'");
			const qCode = q.quiz.quizCode.replace(/'/g, "\\'");
			const fId = (q.quiz.faculty?.facultyId || 'N/A').replace(/'/g, "\\'");
			const dept = meta.dept.replace(/'/g, "\\'");

			return `
							<tr style="border-bottom:1px solid #f1f5f9;">
								<td style="padding:15px; vertical-align:middle;">
									<strong style="color:#1e293b; font-size:15px;">${q.quiz.quizName}</strong><br>
									<span style="font-size:11px; color:var(--primary); font-weight:700;">ID: ${q.quiz.quizCode}</span><br>
									<span style="font-size:12px; color:#64748b;">Duration: ${q.durationMinutes || 30} mins</span>
								</td>
								<td style="padding:15px; vertical-align:middle; color:#475569;">
									<div style="font-weight:600;">${q.quiz.faculty?.facultyName || 'N/A'}</div>
									<div style="font-size:11px; color:#94a3b8;">FID: ${fId}</div>
								</td>
								<td style="padding:15px; text-align:center; vertical-align:middle;">
									<button style="padding:8px 16px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px; transition:0.2s;"
										onmouseover="this.style.background='#059669'"
										onmouseout="this.style.background='#10b981'"
										onclick="window.startQuizProcess(${q.quiz.id}, '${qName}', '${fName}', ${q.durationMinutes || 30}, '${dept}', '${meta.year}', '${meta.section}', '${qCode}', '${fId}')">
										Start
									</button>
								</td>
							</tr>
						`;
		}).join('')}
				</tbody>
			</table>
		`;
	}



	window.startQuizProcess = async (quizId, quizName, facultyName, duration, dept, year, section, quizCode, facultyId) => {
		try {
			const attRes = await authFetch(`/results/student/attempted?rollNumber=${studentRoll}&quizId=${quizId}`);
			if (await attRes.json()) {
				showFacultyNotice("Access Denied", "You have already attempted this quiz. Multiple attempts are not allowed.", "error");
				return;
			}

			const finalDuration = (duration && duration > 0) ? duration : 30;

			// Create Custom Modal for Trusted User Event
			const overlay = document.createElement("div");
			overlay.className = "custom-modal-overlay";
			overlay.innerHTML = `
				<div class="custom-modal-box">
					<h2 style="color:var(--primary); margin-top:0;">Start Exam: ${quizName}</h2>
					<div style="background:#f8fafc; padding:15px; border-radius:8px; text-align:left; margin:15px 0; font-size:14px; line-height:1.6; border:1px solid #e2e8f0;">
						<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
							<div><strong>Exam ID:</strong> ${quizCode}</div>
							<div><strong>FID:</strong> ${facultyId}</div>
						</div>
						<strong>⏱ Duration:</strong> ${finalDuration} Minutes<br>
						<strong>👤 Student:</strong> ${studentRoll}<br><br>
						<strong>⚠️ STRICT EXAM RULES:</strong>
						<ul style="margin:5px 0; padding-left:20px;">
							<li>Full-screen mode is mandatory.</li>
							<li>Tab switching/minimizing will result in termination.</li>
							<li>Right-click, Copy, Paste are disabled.</li>
							<li>Questions with timers will lock automatically.</li>
						</ul>
					</div>
					<div style="display:flex; justify-content:flex-end; gap:10px;">
						<button class="nav-btn" onclick="this.closest('.custom-modal-overlay').remove()">Cancel</button>
						<button class="submit-btn-large" id="confirmStartBtn" style="width:auto; padding:10px 30px; font-size:16px;">I Agree & Start Exam</button>
					</div>
				</div>
			`;
			document.body.appendChild(overlay);

			// Direct binding for trusted event
			overlay.querySelector("#confirmStartBtn").onclick = () => {
				// Immediate fullscreen request to satisfy browser security which must be the FIRST sync action
				enterFullScreen();

				overlay.remove();
				document.getElementById("quizModalOverlay")?.remove();
				document.getElementById("studentModalOverlay")?.remove();

				// Enter environment
				performSecurityPreFlight(quizId, quizName, facultyName, finalDuration, dept, year, section, quizCode, facultyId);
			};

		} catch (e) { alert(e.message); }
	};

	async function performSecurityPreFlight(quizId, quizName, facultyName, duration, dept, year, section, quizCode, facultyId) {
		const sweepOverlay = document.createElement("div");
		sweepOverlay.className = "warning-overlay";
		sweepOverlay.style.zIndex = "15000";
		sweepOverlay.innerHTML = `
			<div class="confirm-modal" style="max-width:500px; text-align:center; padding:40px;">
				<div id="countdownCircle" style="width:80px; height:80px; border-radius:50%; border:5px solid #eef2f6; border-top-color:var(--primary); margin:0 auto 25px; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:900; color:var(--primary);">8</div>
				<h3 style="margin:0 0 10px; color:var(--primary); font-weight:900;">Proctoring Shield Activation</h3>
				<p id="sweepStatus" style="color:var(--text-muted); font-weight:600; min-height:40px;">Initializing secure isolation...</p>
				<div style="width:100%; height:6px; background:#f1f5f9; border-radius:10px; margin:20px 0; overflow:hidden;">
					<div id="sweepProgress" style="width:0%; height:100%; background:var(--primary-grad); transition: width 0.3s linear;"></div>
				</div>
                <div style="font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:1px;">System locking in progress</div>
			</div>
		`;
		document.body.appendChild(sweepOverlay);

		const statusText = sweepOverlay.querySelector("#sweepStatus");
		const progressBar = sweepOverlay.querySelector("#sweepProgress");
		const countdownElem = sweepOverlay.querySelector("#countdownCircle");

		const totalSeconds = 8;
		let elapsed = 0;

		const steps = [
			{ time: 1, msg: "Establishing secure communication tunnel..." },
			{ time: 2.5, msg: "Scanning for active background calls..." },
			{ time: 4, msg: "Analyzing screen-sharing protocols...", isNetwork: true },
			{ time: 5.5, msg: "Shielding browser clipboard & shortcuts..." },
			{ time: 7, msg: "Finalizing proctoring environment..." }
		];

		const checkInterval = setInterval(async () => {
			elapsed += 0.1;
			const remaining = Math.max(0, Math.ceil(totalSeconds - elapsed));
			countdownElem.textContent = remaining;
			progressBar.style.width = `${(elapsed / totalSeconds) * 100}%`;

			// Focus check
			if (document.hidden || !document.hasFocus()) {
				clearInterval(checkInterval);
				sweepOverlay.remove();
				showFacultyNotice("Security Breach", "Activity outside the exam window detected. Isolation failed. Close all other apps and retry.", "error");
				return;
			}

			// Step Updates
			const currentStep = steps.find(s => Math.abs(elapsed - s.time) < 0.05);
			if (currentStep) {
				statusText.textContent = currentStep.msg;

				if (currentStep.isNetwork) {
					try {
						const start = Date.now();
						const res = await fetch("/ping", { method: "HEAD", cache: "no-store" });
						const latency = Date.now() - start;
						if (!res.ok || latency > 3000) throw new Error();
						statusText.textContent = `Network Stable (Latency: ${latency}ms)`;
					} catch (e) {
						clearInterval(checkInterval);
						sweepOverlay.remove();
						showFacultyNotice("Network Error", "Unstable internet detected during system lock. Please check your connection.", "error");
						return;
					}
				}
			}

			if (elapsed >= totalSeconds) {
				clearInterval(checkInterval);

				// Final Declaration
				sweepOverlay.innerHTML = `
					<div class="confirm-modal" style="max-width:550px; text-align:center; padding:40px; border:3px solid #fbdad0;">
						<div style="font-size:50px; margin-bottom:20px;">🛡️</div>
						<h3 style="margin:0 0 15px; color:#e11d48; font-weight:900;">Final Security Declaration</h3>
						<p style="color:#475569; font-weight:600; line-height:1.6; text-align:left; margin-bottom:25px; background:#fff1f2; padding:20px; border-radius:15px;">
							I solemnly declare that <b>no communication apps</b> (Zoom, Teams, WhatsApp, etc.) are active and <b>no screen-sharing or recording software</b> is running on this device. I understand that any attempt to use these will result in immediate termination of the exam.
						</p>
						<div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
							<button id="cancelSweep" class="nav-btn" style="height:50px;">Go Back</button>
							<button id="finalEnter" class="btn-premium btn-primary-grad" style="height:50px; font-weight:900;">I DECLARE & PROCEED</button>
						</div>
					</div>
				`;

				sweepOverlay.querySelector("#cancelSweep").onclick = () => sweepOverlay.remove();
				sweepOverlay.querySelector("#finalEnter").onclick = () => {
					sweepOverlay.remove();
					enterExamEnvironment(quizId, quizName, facultyName, duration, dept, year, section);
				};
			}
		}, 100);
	}

	// -------------------- EXAM ENVIRONMENT --------------------
	async function enterExamEnvironment(quizId, quizName, facultyName, duration, dept, year, section) {
		try {
			const res = await authFetch(`/quiz/${quizId}/sections/for-student?department=${dept}&year=${year}&section=${section}`);
			let sections = await res.json();
			if (!sections?.length) return alert("Error: Sections or questions not loaded.");

			// Flatten questions and assign section info
			let allQuestions = [];
			sections.forEach(sec => {
				const secQs = (sec.questions || []).map(q => ({
					...q,
					sectionId: sec.id,
					sectionName: sec.sectionName
				}));
				allQuestions = allQuestions.concat(secQs);
			});

			if (!allQuestions.length) return alert("Error: No questions found in this exam.");

			// Prep Data
			const seed = hashString(studentRoll + quizId);
			// Optional: Shuffle within sections or whole? Let's keep the section order but shuffle within.
			let finalQuestions = [];
			sections.forEach(sec => {
				let secQs = allQuestions.filter(q => q.sectionId === sec.id);
				secQs = shuffleArray(secQs, seed);
				finalQuestions = finalQuestions.concat(secQs);
			});

			currentExam = {
				active: true,
				quizId,
				quizName,
				facultyName,
				sections: sections, // Keep original sections for navigation
				questions: finalQuestions,
				answers: {},
				currentIndex: 0,
				totalSeconds: duration * 60,
				blurWarnings: 0,
				timers: {},
				startTime: new Date().toISOString(),
				lockedQuestions: new Set(),
				visitedQuestions: new Set(),
				markedForReview: new Set(),
				student: JSON.parse(sessionStorage.getItem("user") || "{}")
			};

			renderExamUI();
			document.body.classList.add("exam-body-locked"); // Lock main scroll
			renderExamUI();
			document.body.classList.add("exam-body-locked"); // Lock main scroll
			setupProctoring();
			enterFullScreen();

			// Show instructions immediately. Only start timer when user Acknowledges.
			showInstructions(() => {
				startGlobalTimer();
			});

			// Consolidate connectivity check
			const statusInterval = setInterval(async () => {
				if (!currentExam.active) { clearInterval(statusInterval); return; }
				const ping = document.getElementById("pingStatus");
				if (!ping) return; // Prevent null error if UI not rendered

				try {
					const start = Date.now();
					const res = await fetch("/ping", { method: "HEAD" });
					const latency = Date.now() - start;
					currentExam.isConnectionStable = res.ok;

					if (ping) {
						if (res.ok) {
							ping.className = "status-pill status-online";
							ping.innerHTML = `<span>●</span> Connection: Stable (${latency}ms)`;
						} else {
							throw new Error();
						}
					}
				} catch (e) {
					currentExam.isConnectionStable = false;
					ping.className = "status-pill status-offline";
					ping.innerHTML = "<span>●</span> Connection: LOST - DO NOT REFRESH";
				}
			}, 5000);

			// Fullscreen & Escape protection
			document.addEventListener("fullscreenchange", handleFullscreenExit);
			document.addEventListener("webkitfullscreenchange", handleFullscreenExit);
			document.addEventListener("keydown", handleKeydown);

			// Disable Copy, Paste, Cut, Context Menu
			document.addEventListener("contextmenu", e => e.preventDefault());
			document.addEventListener("copy", e => e.preventDefault());
			document.addEventListener("paste", e => e.preventDefault());
			document.addEventListener("cut", e => e.preventDefault());

			// Block sensitive keys
			document.addEventListener("keydown", e => {
				const forbiddenKeys = ['c', 'v', 'x', 'p', 'u', 's', 'a'];
				if ((e.ctrlKey || e.metaKey) && forbiddenKeys.includes(e.key.toLowerCase())) {
					e.preventDefault();
					showWarning("SECURITY ALERT: System shortcuts are disabled for exam integrity.");
				}
				if (e.key === 'PrintScreen' || e.key === 'F12' || (e.shiftKey && e.metaKey && e.key === 's')) {
					e.preventDefault();
					showWarning("SECURITY ALERT: Screen capture and dev tools are prohibited.");
				}
			});

		} catch (e) { alert("Failed to start exam: " + e.message); }
	}

	function renderExamUI() {
		const existing = document.querySelector(".exam-overlay");
		if (existing) existing.remove();

		// Use a container for the 3-column layout
		const overlay = document.createElement("div");
		overlay.className = "exam-overlay";
		// The 3-column layout structure
		overlay.innerHTML = `
      <div id="topConnectivityBar" style="grid-column: 1 / -1; background: #0f172a; color: white; padding: 0 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); z-index: 1000; position:relative; height:36px;">
         <div style="display:flex; align-items:center; gap:20px;">
            <div style="font-weight:900; letter-spacing:1px; font-size:14px; text-transform:uppercase; color:var(--primary);">${currentExam.quizName}</div>
            <div style="height:14px; width:1px; background:rgba(255,255,255,0.2);"></div>
            <div style="font-size:12px; font-weight:700; color:#94a3b8;">${currentExam.student.studentName || 'Student'} | ${studentRoll}</div>
         </div>
         <div id="pingStatus" class="status-pill status-online" style="margin:0; font-weight:800; font-size:10px; letter-spacing:0.5px; border-radius:100px; padding:4px 12px; background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.2); color:#10b981;">
            <span>●</span> Connection: Stable (---ms)
         </div>
      </div>

      <div class="exam-grid-container">
        
        <!-- COLUMN 1: LEFT PANEL -->
        <div class="exam-col col-left">
          <div class="panel-header">Question Panel</div>
          <div class="panel-content">
            <button class="instruction-btn" id="viewInstrBtn">View Instructions</button>
            
            <div class="question-meta-box">
              <div class="meta-header">Question Details</div>
              <div class="meta-body">
                <div class="meta-row">
                  <span>Question:</span>
                  <span class="meta-val" id="dispQNum">1</span>
                    <span class="info-icon" title="Question Info">ⓘ</span>
                </div>
                <div class="meta-row">
                  <span>Marks:</span>
                  <span class="meta-val good" id="dispQMarks">2</span>
                </div>
                <div class="meta-row">
                  <span>Negative Marks:</span>
                  <span class="meta-val bad" id="dispQNeg">-0.5</span>
                </div>
                <div class="meta-row timer-row" id="qTimerRow" style="display:none;">
                   <span>Time Left:</span>
                   <span class="meta-val warning" id="qRemaining">--</span>
                </div>
              </div>
            </div>

             <div class="left-footer">
                <button class="nav-btn prev-btn" id="exPrev">
                  <span class="icon">❮</span> Previous
                </button>
             </div>
          </div>
        </div>

        <!-- COLUMN 2: CENTER PANEL (Question Area) -->
        <div class="exam-col col-center">
          <div class="panel-header">Question & Options</div>
          <div class="panel-content scrollable">
             <div class="question-area">
                <div class="q-text-display" id="dispQText">
                  <!-- Question Text Goes Here -->
                </div>
                
                <div class="options-area">
                   <p class="opt-instruction">Select the correct answer from the options below:</p>
                   <div id="examOptionsList" class="options-vertical-list">
                      <!-- Options Go Here -->
                   </div>
                </div>
             </div>
             
             <div class="center-footer">
               <button class="action-btn clear-btn" id="exReset">Clear Answer</button>
               <button class="nav-btn next-btn" id="exNext">Next</button>
             </div>
          </div>
        </div>

        <!-- COLUMN 3: RIGHT PANEL (Navigation) -->
        <div class="exam-col col-right">
          <div class="panel-header">Question Navigation</div>
          <div class="panel-content">
             
             <div class="timer-display-box">
                <span class="timer-label">Time Remaining:</span>
                <span class="timer-value" id="globalTimer">00:00:00</span>
             </div>

             <div class="grid-wrapper">
                <div class="nav-grid" id="examNavGrid">
                   <!-- Grid Circles -->
                </div>
             </div>

              <div class="status-legend">
                 <div class="legend-item"><span class="dot answered"></span> Answered</div>
                 <div class="legend-item"><span class="dot not-answered"></span> Not Answered</div>
                 <div class="legend-item"><span class="dot not-visited"></span> Not Visited</div>
                 <div class="legend-item"><span class="dot review"></span> Marked for Review</div>
              </div>

             <div class="right-footer">
                <div style="text-align:center; margin-bottom:10px;">
                    <button class="action-btn review-btn" id="exReview" style="width:100%; margin-bottom:10px;">
                        🏴 Mark for Review
                    </button>
                </div>
                <button class="submit-btn-large" id="exSubmit">Submit</button>
             </div>
          </div>
        </div>

      </div>
    `;
		document.body.appendChild(overlay);

		// Wire up buttons
		// Wire up buttons
		overlay.querySelector("#exPrev").onclick = () => moveQuestion(-1);
		overlay.querySelector("#exNext").onclick = () => moveQuestion(1);
		overlay.querySelector("#exReset").onclick = resetCurrentAnswer;
		overlay.querySelector("#exReview").onclick = toggleMarkForReview;
		overlay.querySelector("#exSubmit").onclick = () => showExitConfirm("Are you sure you want to finish the exam?", true);
		overlay.querySelector("#viewInstrBtn").onclick = showInstructions;

		renderActiveQuestion();
		renderNavGrid();
	}

	function handleFullscreenExit() {
		// Only trigger if we are active AND not in valid fullscreen AND no modal is already up
		if (currentExam.active &&
			!document.fullscreenElement &&
			!document.webkitFullscreenElement &&
			!document.querySelector(".warning-overlay")) {

			showExitConfirm("You have exited full-screen mode. This is logged as a violation. Click 'Continue Exam' to return to full-screen and resume.", false);
		}
	}

	function handleKeydown(e) {
		// Removed ESC prevention as it's unreliable and handled by fullscreenchange
		// We can still block other keys
	}

	function showExitConfirm(msg, isSubmit = false) {
		showModernModal({
			title: isSubmit ? "Final Submission" : "Exam Paused",
			body: msg,
			icon: isSubmit ? "📝" : "⏸️",
			buttons: isSubmit ? [
				{ id: "cancelSub", text: "Cancel", className: "nav-btn", callback: null },
				{ id: "finalSub", text: "Submit Now", className: "nav-btn next-btn", callback: () => submitExam(false, true) }
			] : [
				{ id: "panicSub", text: "Submit Exam", className: "exam-btn btn-danger", callback: () => submitExam(false, true) },
				{ id: "continueExam", text: "Continue Exam", className: "nav-btn next-btn", callback: () => { setTimeout(() => enterFullScreen(), 50); } }
			]
		});
	}

	function showInstructions(onAcknowledge = null) {
		const exam = currentExam;
		if (!exam.active) return;

		const sectionsCount = exam.sections.length;
		const totalQs = exam.questions.length;
		let totalMarks = 0;
		exam.questions.forEach(q => totalMarks += (q.marks || 0));

		let sectionDetailsHTML = "";
		if (sectionsCount > 1 || (sectionsCount === 1 && exam.sections[0].id !== -1)) {
			sectionDetailsHTML = `
				<div style="margin-top:15px; background:#f8fafc; padding:15px; border-radius:10px; border:1px solid #e2e8f0;">
					<h4 style="margin:0 0 10px; color:var(--primary); font-size:14px; font-weight:800;">Batch Assignment Breakdown</h4>
					<table style="width:100%; border-collapse:collapse; font-size:13px;">
						<thead>
							<tr style="text-align:left; color:#64748b; border-bottom:1px solid #e2e8f0;">
								<th style="padding:10px 5px;">Section Name</th>
								<th style="padding:10px 5px; text-align:center;">Questions</th>
								<th style="padding:10px 5px; text-align:right;">Marks</th>
							</tr>
						</thead>
						<tbody>
							${exam.sections.map(sec => {
				const secQs = exam.questions.filter(q => q.sectionId === sec.id);
				const secMarks = secQs.reduce((sum, q) => sum + (q.marks || 0), 0);
				if (secQs.length === 0) return "";
				return `
									<tr style="border-bottom:1px solid #f1f5f9;">
										<td style="padding:12px 5px; font-weight:700; color:#1e293b;">${sec.sectionName}</td>
										<td style="padding:12px 5px; text-align:center; color:#475569;">${secQs.length}</td>
										<td style="padding:12px 5px; text-align:right; font-weight:800; color:var(--primary);">${secMarks.toFixed(1)}</td>
									</tr>
								`;
			}).join('')}
						</tbody>
					</table>
				</div>
			`;
		} else {
			sectionDetailsHTML = `
				<div style="margin-top:15px; background:#f8fafc; padding:25px; border-radius:15px; border:1px solid #e2e8f0; text-align:center;">
					<div style="font-size:13px; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Structure Overview</div>
					<div style="display:flex; justify-content:center; gap:40px;">
						<div>
							<div style="font-size:28px; font-weight:900; color:#1e293b;">${totalQs}</div>
							<div style="font-size:11px; font-weight:700; color:#94a3b8;">QUESTIONS</div>
						</div>
						<div style="width:1px; background:#e2e8f0;"></div>
						<div>
							<div style="font-size:28px; font-weight:900; color:var(--primary);">${totalMarks.toFixed(1)}</div>
							<div style="font-size:11px; font-weight:700; color:#94a3b8;">TOTAL MARKS</div>
						</div>
					</div>
				</div>
			`;
		}

		const modal = document.createElement("div");
		modal.className = "warning-overlay";
		modal.style.cssText = "z-index:12000; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.9); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center;";
		modal.innerHTML = `
      <div class="confirm-modal" style="text-align:left; max-width:700px; width:90%; padding:40px; background:white; border-radius:24px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px; border-bottom:1px solid #f1f5f9; padding-bottom:20px;">
           <div>
			   <h3 style="margin:0 0 5px; color:#1e293b; font-size:24px; font-weight:900;">${exam.quizName}</h3>
			   <div style="font-size:13px; color:#64748b; font-weight:600;">Faculty: <span style="color:var(--primary);">${exam.facultyName}</span></div>
		   </div>
           <div style="background:rgba(99, 102, 241, 0.1); color:var(--primary); padding:8px 20px; border-radius:100px; font-weight:900; font-size:13px; border:1px solid rgba(99, 102, 241, 0.2);">
             WEIGHTAGE: ${totalMarks.toFixed(1)} MARKS
           </div>
        </div>

        <div style="max-height:55vh; overflow-y:auto; padding-right:15px;" class="scrollable">
			${sectionDetailsHTML}

			<h4 style="margin:30px 0 15px; color:#1e293b; font-size:16px; font-weight:800; display:flex; align-items:center; gap:10px;">
				<span style="background:var(--primary); color:white; width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:12px;">⚖</span>
				Exam Rules & Code of Conduct
			</h4>
			<ul style="padding:0; margin:0; list-style:none; display:grid; gap:12px;">
			  ${[
				{ t: "SECURE MODE", d: "Fullscreen is mandatory. Any attempt to exit fullscreen will be logged as a violation." },
				{ t: "SYSTEM LOCK", d: "Right-click, Copy, Paste, and PrintScreen are completely disabled." },
				{ t: "TAB MONITORING", d: "Switching tabs or minimizing the browser will lead to auto-submission after limit." },
				{ t: "TIME CONSTRAINT", d: "The exam timer runs continuously. Individual question timers may also apply." },
				{ t: "AUTO-SUBMISSION", d: "Upon timer expiry, your progress will be automatically saved and submitted." }
			].map(r => `
			  	<li style="background:#f8fafc; padding:12px 15px; border-radius:12px; border-left:4px solid var(--primary);">
					<strong style="font-size:12px; color:var(--primary); display:block; margin-bottom:2px;">${r.t}</strong>
					<span style="font-size:13px; color:#475569; font-weight:500;">${r.d}</span>
				</li>
			  `).join('')}
			</ul>
		</div>

        <button class="submit-btn-large" style="width:100%; margin-top:30px; height:56px; font-size:16px; font-weight:900; letter-spacing:1px; box-shadow:0 10px 20px rgba(99, 102, 241, 0.2);" id="ackInstrBtn">ACKNOWLEDGE & START ASSESSMENT</button>
      </div>
    `;
		document.body.appendChild(modal);

		modal.querySelector("#ackInstrBtn").onclick = () => {
			modal.remove();
			if (onAcknowledge) onAcknowledge();
		};
	}

	function renderActiveQuestion() {
		const q = currentExam.questions[currentExam.currentIndex];
		if (!q) return;

		// Mark as visited
		currentExam.visitedQuestions.add(q.questionId);

		const isLocked = currentExam.lockedQuestions.has(q.questionId);

		// Update Left Panel Meta
		const dispQNum = document.getElementById("dispQNum");
		if (dispQNum) dispQNum.textContent = `${currentExam.currentIndex + 1}`;

		const dispMarks = document.getElementById("dispQMarks");
		if (dispMarks) dispMarks.textContent = q.marks;

		const dispNeg = document.getElementById("dispQNeg");
		if (dispNeg) dispNeg.textContent = q.negativeMarks;

		const timerRow = document.getElementById("qTimerRow");
		const qTimeLimit = q.timeLimitSeconds || q.timeLimit;
		if (qTimeLimit) {
			timerRow.style.display = "flex";
		} else {
			timerRow.style.display = "none";
		}

		// Update Center Panel Text
		const qTextDiv = document.getElementById("dispQText");

		if (isLocked) {
			qTextDiv.innerHTML = `
				<div style="opacity:0.5; pointer-events:none;">
					<h3 style="white-space: pre-wrap; font-family: 'Consolas', monospace; font-size: 19px;">${q.questionText}</h3>
					${q.questionImage ? `<div style="margin-top:15px;"><img src="${q.questionImage}" style="max-width:100%; border-radius:8px; border:1px solid #ddd;"></div>` : ""}
				</div>
				<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(200,200,200,0.2); display:flex; align-items:center; justify-content:center; border-radius:12px; z-index: 10;">
					<h2 style="color:var(--danger); background:white; padding:15px 30px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); font-weight: 900; border: 3px solid var(--danger);">🔒 TIME EXPIRED</h2>
				</div>
			`;
			qTextDiv.style.position = "relative";
		} else {
			qTextDiv.innerHTML = `
				<h3 style="white-space: pre-wrap; font-family: 'Consolas', monospace; font-size: 19px;">${q.questionText}</h3>
				${q.questionImage ? `<div style="margin-top:15px; text-align:center;"><img src="${q.questionImage}" style="max-width:100%; border-radius:15px; box-shadow:0 10px 30px rgba(0,0,0,0.1); border:5px solid white;"></div>` : ""}
			`;
			qTextDiv.style.position = "relative";
		}


		// Panel 3: Options / Input
		const oList = document.getElementById("examOptionsList");
		oList.innerHTML = "";

		if (q.questionType === "NUMERICAL") {
			const savedAns = currentExam.answers[q.questionId] || "";
			const inputContainer = document.createElement("div");
			inputContainer.style.padding = "20px 0";
			inputContainer.innerHTML = `
				<label style="display:block; margin-bottom:10px; font-weight:700; color:var(--text-main);">Enter your numerical answer:</label>
				<input type="number" step="any" id="numericalAnswerInput" 
					style="width: 100%; max-width: 300px; padding: 15px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 18px; font-weight: 600; outline:none; transition: border-color 0.2s;"
					placeholder="e.g. 10.5">
			`;
			const input = inputContainer.querySelector("input");
			input.value = savedAns;
			if (isLocked) {
				input.disabled = true;
				input.style.background = "#f1f5f9";
			}

			input.oninput = () => {
				input.style.borderColor = "var(--primary)";
				saveAnswer();
			};

			oList.appendChild(inputContainer);

		} else {
			// MCQ Logic
			const correctOpt = q.options?.correctOption || "";
			const isMulti = correctOpt.includes(",");
			const savedAns = currentExam.answers[q.questionId] || "";
			const selectedList = savedAns.split(",").filter(x => x);

			const choices = q.options?.choices || [];
			const choiceImgs = q.options?.choiceImages || [];
			choices.forEach((opt, idx) => {
				const item = document.createElement("div");
				item.className = `option-item ${isMulti ? 'multi' : ''} ${selectedList.includes(opt) ? 'selected' : ''} ${isLocked ? 'locked' : ''}`;

				const imgData = choiceImgs[idx];

				item.innerHTML = `
			<div class="option-circle"></div>
			<div style="flex:1; display:flex; flex-direction:column; gap:8px;">
			  <span>${opt}</span>
			  ${imgData ? `<div><img src="${imgData}" style="max-width:200px; border-radius:6px; border:1px solid #eef2f6;"></div>` : ""}
			</div>
			<input type="${isMulti ? 'checkbox' : 'radio'}" name="qOpt" value="${opt}" ${selectedList.includes(opt) ? 'checked' : ''} ${isLocked ? 'disabled' : ''}>
		  `;

				if (!isLocked) {
					item.onclick = () => {
						const input = item.querySelector("input");
						if (isMulti) {
							input.checked = !input.checked;
							item.classList.toggle("selected", input.checked);
						} else {
							oList.querySelectorAll(".option-item").forEach(i => i.classList.remove("selected"));
							item.classList.add("selected");
							input.checked = true;
						}
						saveAnswer();
					};
				}
				oList.appendChild(item);
			});
		}

		// Logic for Question Timer (Spendable time per question)
		if (qTimeLimit && !isLocked) {
			if (!currentExam.timers[q.questionId]) {
				currentExam.timers[q.questionId] = qTimeLimit;
			}

			// Clear existing interval if any to prevent duplicates
			if (currentExam.activeTimerInterval) clearInterval(currentExam.activeTimerInterval);

			const disp = document.getElementById("qRemaining");
			if (disp) disp.textContent = currentExam.timers[q.questionId];

			currentExam.activeTimerInterval = setInterval(() => {
				if (!currentExam.active) { clearInterval(currentExam.activeTimerInterval); return; }
				// If we have moved away from this question, pause this timer
				if (currentExam.questions[currentExam.currentIndex].questionId !== q.questionId) {
					clearInterval(currentExam.activeTimerInterval);
					return;
				}

				currentExam.timers[q.questionId]--;
				if (disp) disp.textContent = currentExam.timers[q.questionId];

				if (currentExam.timers[q.questionId] <= 0) {
					clearInterval(currentExam.activeTimerInterval);
					currentExam.lockedQuestions.add(q.questionId);

					// Check if ALL questions are now locked
					const allLocked = currentExam.questions.every(quest =>
						currentExam.lockedQuestions.has(quest.questionId)
					);

					if (allLocked) {
						showModernModal({
							title: "Exam Complete",
							body: "All questions are now timed out. Your exam is being auto-submitted.",
							icon: "⌛",
							buttons: [{ id: "autoSubOk", text: "Submit Now", className: "nav-btn next-btn", callback: () => submitExam(true) }]
						});
						setTimeout(() => { if (currentExam.active) submitExam(true); }, 3000);
					} else {
						showModernModal({
							title: "Time Expired",
							body: "Time for this question has run out. It is now locked.",
							icon: "🔒",
							buttons: [{ id: "timerOk", text: "Next Question", className: "nav-btn next-btn", callback: () => moveQuestion(1) }]
						});
					}
					renderActiveQuestion();
					renderNavGrid();
				}
			}, 1000);
		}

		updateControlButtons();
	}

	function renderNavGrid() {
		const grid = document.getElementById("examNavGrid");
		grid.innerHTML = "";

		// Set grid to 1 column to accommodate headers and then use a flex or nested grid for circles
		grid.style.display = "flex";
		grid.style.flexDirection = "column";
		grid.style.gap = "20px";

		(currentExam.sections || []).forEach(sec => {
			const sectionQs = currentExam.questions.filter(q => q.sectionId === sec.id || (sec.id === -1 && !q.sectionId));
			if (sectionQs.length === 0) return;

			const secContainer = document.createElement("div");
			secContainer.className = "nav-section-group";

			const secTitle = document.createElement("div");
			secTitle.className = "nav-section-title";
			secTitle.style.cssText = "font-size: 13px; font-weight: 800; color: var(--primary); text-transform: uppercase; margin-bottom: 10px; border-left: 4px solid var(--primary); padding-left: 10px;";
			secTitle.textContent = sec.sectionName;
			secContainer.appendChild(secTitle);

			const circleGrid = document.createElement("div");
			circleGrid.style.display = "grid";
			circleGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(40px, 1fr))";
			circleGrid.style.gap = "10px";

			sectionQs.forEach(q => {
				const qGlobalIndex = currentExam.questions.indexOf(q);
				const isAnswered = !!currentExam.answers[q.questionId];

				const circle = document.createElement("div");
				const classes = ["nav-circle"];

				if (currentExam.markedForReview.has(q.questionId)) classes.push("review");
				else if (isAnswered) classes.push("answered");
				else if (currentExam.lockedQuestions.has(q.questionId)) classes.push("locked");
				else if (currentExam.visitedQuestions.has(q.questionId)) classes.push("not-answered");
				else classes.push("not-visited");

				if (qGlobalIndex === currentExam.currentIndex) classes.push("current");

				circle.className = classes.join(" ");
				circle.textContent = qGlobalIndex + 1;
				circle.onclick = () => {
					if (currentExam.lockedQuestions.has(q.questionId)) return;
					currentExam.currentIndex = qGlobalIndex;
					renderActiveQuestion();
					renderNavGrid();
				};
				circleGrid.appendChild(circle);
			});

			secContainer.appendChild(circleGrid);
			grid.appendChild(secContainer);
		});
	}

	function toggleMarkForReview() {
		const q = currentExam.questions[currentExam.currentIndex];
		if (currentExam.markedForReview.has(q.questionId)) {
			currentExam.markedForReview.delete(q.questionId);
		} else {
			currentExam.markedForReview.add(q.questionId);
		}
		renderNavGrid();
	}

	function saveAnswer() {
		const q = currentExam.questions[currentExam.currentIndex];
		if (!q) return;

		if (q.questionType === "NUMERICAL") {
			const input = document.getElementById("numericalAnswerInput");
			if (input) {
				currentExam.answers[q.questionId] = input.value;
			}
		} else {
			const checked = Array.from(document.querySelectorAll("#examOptionsList input:checked")).map(i => i.value);
			currentExam.answers[q.questionId] = checked.join(",");
		}
		renderNavGrid();
	}

	function resetCurrentAnswer() {
		const q = currentExam.questions[currentExam.currentIndex];
		if (!q) return;
		if (currentExam.lockedQuestions.has(q.questionId)) return;
		currentExam.answers[q.questionId] = "";
		renderActiveQuestion();
		renderNavGrid();
	}

	function moveQuestion(dir) {
		let newIdx = currentExam.currentIndex + dir;

		// Search for next available question that isn't locked
		let found = false;
		let steps = 0;
		const maxSteps = currentExam.questions.length; // Safety break

		while (newIdx >= 0 && newIdx < currentExam.questions.length && steps < maxSteps) {
			const nextQ = currentExam.questions[newIdx];
			if (!nextQ) break; // Array bounds protection

			if (!currentExam.lockedQuestions.has(nextQ.questionId)) {
				found = true;
				break;
			}
			newIdx += (dir > 0 ? 1 : -1);
			steps++;
		}

		if (found) {
			currentExam.currentIndex = newIdx;
			renderActiveQuestion();
			renderNavGrid();
		} else {
			// If moving forward and hit end, or moving back and hit start (or all locked)
			// Maybe show a toast or shake the container?
			// For now, do nothing if no valid question in that direction.

			// Optional: If we tried to go Next from the last question, user might want to submit
			if (dir > 0 && newIdx >= currentExam.questions.length) {
				// Maybe prompt submission?
			}
		}
	}

	function updateControlButtons() {
		document.getElementById("exPrev").disabled = currentExam.currentIndex === 0;
		document.getElementById("exNext").disabled = currentExam.currentIndex === currentExam.questions.length - 1;
	}

	function startGlobalTimer() {
		const timerElem = document.getElementById("globalTimer");

		// Ensure initial render
		if (timerElem) timerElem.textContent = formatTime(currentExam.totalSeconds);

		const interval = setInterval(() => {
			if (!currentExam.active) { clearInterval(interval); return; }

			currentExam.totalSeconds--;
			if (timerElem) timerElem.textContent = formatTime(currentExam.totalSeconds);

			if (currentExam.totalSeconds <= 0) {
				clearInterval(interval);
				alert("Exam time is up! Auto-submitting...");
				submitExam(true);
			}
		}, 1000);
	}

	async function submitExam(forced = false, skipConfirm = false) {
		if (!forced && !skipConfirm && !confirm("Are you really sure you want to finish the exam?")) return;

		currentExam.active = false;

		// Show loading state
		const overlay = document.querySelector(".exam-overlay");
		if (overlay) {
			const loader = document.createElement("div");
			loader.id = "subLoader";
			loader.style.cssText = "position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:100;";
			loader.innerHTML = `<div class="loading-spinner"></div><h2 style="color:var(--primary); margin-top:20px;">Submitting Exam...</h2>`;
			overlay.appendChild(loader);
		}

		try {
			const payload = {
				rollNumber: studentRoll,
				quizId: currentExam.quizId,
				answers: currentExam.answers,
				startTime: currentExam.startTime,
				endTime: new Date().toISOString()
			};

			const res = await authFetch("/results/submit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
			if (res.ok) {
				if (document.fullscreenElement) {
					try { await document.exitFullscreen(); } catch (e) { }
				}

				document.querySelector(".exam-overlay")?.remove();
				document.body.classList.remove("exam-body-locked"); // Restore scroll
				alert("Assessment submitted successfully. You can now view your result in the 'View Results' section.");

				// Reset to dashboard
				document.getElementById("studentDashboard")?.classList.remove("hidden");

				// Automatically trigger results view
				viewResultBtn?.click();
			} else {
				const errorMsg = await res.text();
				throw new Error(errorMsg);
			}
		} catch (e) {
			alert("Submission failed! " + e.message);
			document.getElementById("subLoader")?.remove();
			currentExam.active = true; // Allow retry
		}
	}

	function setupProctoring() {
		const handleViolation = () => {
			if (!currentExam.active) return;
			currentExam.blurWarnings++;

			if (currentExam.blurWarnings > 5) {
				submitExam(true);
				showModernModal({
					title: "Exam Terminated",
					body: "You have exceeded the maximum of 5 tab switch warnings. Your exam has been auto-submitted.",
					icon: "🚫",
					buttons: [{ id: "termOk", text: "Back to Dashboard", className: "nav-btn next-btn", callback: null }]
				});
			} else {
				showModernModal({
					title: "Security Violation",
					body: `Tab switching or minimizing detected. You have ${5 - currentExam.blurWarnings} attempts remaining before automatic termination.`,
					icon: "⚠️",
					violationCount: currentExam.blurWarnings,
					buttons: [{ id: "warnOk", text: "I Understand", className: "nav-btn next-btn", callback: () => { setTimeout(enterFullScreen, 50); } }]
				});
			}
		};

		window.onblur = handleViolation;
		document.addEventListener("visibilitychange", () => {
			if (document.hidden) handleViolation();
		});
	}

	function showWarning(msg) {
		showModernModal({
			title: "Security Alert",
			body: msg,
			icon: "🛡️",
			buttons: [{ id: "alertOk", text: "I Understand", className: "nav-btn next-btn", callback: () => { setTimeout(enterFullScreen, 50); } }]
		});
	}

	function enterFullScreen() {
		const el = document.documentElement;
		if (el.requestFullscreen) el.requestFullscreen();
		else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
	}

	// Store results in a map to avoid JSON serialization in HTML attributes
	const resultsCache = new Map();

	// -------------------- VIEW RESULTS --------------------
	viewResultBtn?.addEventListener("click", () => {
		const roll = getRoll();
		if (!roll) return alert("Please login first to view results.");
		const content = `
      <div style="display:grid; gap:10px;">
        <input type="text" id="resRoll" value="${roll}" disabled class="modal-select">
        <button class="primary-btn" id="loadResBtn">Load My Results</button>
      </div>
      <div id="resList" style="margin-top:20px; max-height:400px; overflow-y:auto; padding-right:5px;"></div>
    `;
		const modalOverlay = createBaseModal("My Academic Performance", content);

		modalOverlay.querySelector("#loadResBtn").onclick = async () => {
			const list = modalOverlay.querySelector("#resList");
			list.innerHTML = `<div style="text-align:center; padding:20px;"><div class="loading-spinner"></div><p>Fetching your results...</p></div>`;

			try {
				const r = await authFetch(`/results/student/all?rollNumber=${encodeURIComponent(studentRoll)}`);
				if (!r.ok) throw new Error(await r.text());
				const data = await r.json();

				if (!data || data.length === 0) {
					list.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">No results found.</div>`;
					return;
				}

				list.innerHTML = data.map((res, index) => {
					const resId = `res_${Date.now()}_${index}`;
					resultsCache.set(resId, res);
					const isPending = res.passFail === "Result Pending";
					const isPublished = res.published || res.isPublished;

					return `
            <div class="key-item" style="cursor:pointer; position:relative; overflow:hidden; margin-bottom:10px; border:1px solid #e2e8f0; border-radius:10px; padding:15px; transition:all 0.2s;" 
                 onmouseover="this.style.borderColor='var(--primary-purple)'; this.style.background='#fdf5ff';" 
                 onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='white';"
                 onclick="window.showResultDetails('${resId}')">
              ${isPending ? `<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center; font-weight:700; color:#64748b; z-index:5;">🔒 ASSESSMENT PENDING</div>` : ""}
              <div style="display:flex; justify-content:space-between; align-items:center; position:relative; z-index:1;">
                <div>
                  <strong style="font-size:18px; color:#1e293b;">${res.quiz ? res.quiz.quizName : 'Unknown Quiz'}</strong>
                  <br><small style="color:#64748b; font-weight:600;">${isPending ? 'Not yet evaluated' : (res.passFail || 'N/A')} | ${new Date(res.submissionTime).toLocaleDateString()}</small>
                </div>
                <div class="result-score" style="font-size:24px; font-weight:900; color:${isPending ? '#cbd5e1' : 'var(--primary)'}">
                  ${isPending ? '--' : (res.score != null ? res.score.toFixed(1) : '0')}
                  <span style="font-size:14px; color:#94a3b8; font-weight:600;">/${res.totalMarks || '--'}</span>
                </div>
              </div>
              ${isPublished ? `<p style="color:#10b981; margin-top:10px; font-size:12px; font-weight:800;">★ SOLUTIONS AVAILABLE - CLICK TO VIEW</p>` : `<p style="color:#ef4444; margin-top:10px; font-size:12px; font-weight:800;">RESULTS NOT PUBLISHED BY FACULTY</p>`}
            </div>
          `;
				}).join("");
			} catch (e) {
				console.error(e);
				list.innerHTML = `<div style="text-align:center; color:red; padding:20px;">Error loading data: ${e.message}</div>`;
			}
		};
	});

	window.showResultDetails = (resId) => {
		const resData = resultsCache.get(resId);
		if (resData) {
			// Hide the results list modal while viewing details
			const listModal = document.getElementById("studentModalOverlay");
			if (listModal) listModal.style.visibility = "hidden";
			window.showDetailedKey(resData);
		}
	};

	window.showDetailedKey = async (resData) => {
		const isPublished = resData.published || resData.isPublished;
		if (!isPublished) return alert("The detailed solutions for this quiz are not yet available.");

		// Fetch actual questions to show the correct key
		const qRes = await authFetch(`/quiz/${resData.quiz.id}/questions`);
		const questions = await qRes.json();

		const overlay = document.createElement("div");
		overlay.className = "exam-overlay solver-view";
		overlay.style.zIndex = "11000"; // Above everything
		overlay.innerHTML = `
      <div class="panel-header" style="display:flex; justify-content:space-between; align-items:center; padding:25px 40px; background:var(--header-grad); border:none; box-shadow:0 10px 40px rgba(99, 102, 241, 0.3);">
          <div style="text-align:left;">
            <h2 style="margin:0; font-size:26px; font-weight:900; color:white; letter-spacing:-0.5px;">Assessment Solver Key</h2>
            <div style="display:flex; gap:20px; align-items:center; margin-top:10px;">
               <span style="background:rgba(255,255,255,0.25); color:white; padding:6px 16px; border-radius:100px; font-size:13px; font-weight:900; backdrop-filter:blur(15px); border:1px solid rgba(255,255,255,0.2);">
                 Final Score: <b>${resData.score.toFixed(1)} / ${resData.totalMarks}</b>
               </span>
               <span style="color:rgba(255,255,255,0.9); font-size:13px; font-weight:700; letter-spacing:1px;">CODE: ${resData.quiz.quizCode}</span>
            </div>
          </div>
          <button class="btn-premium" id="closeSolver" style="background:#ff4757; color:white; border:none; box-shadow:0 10px 25px rgba(255, 71, 87, 0.4); height:54px; min-width:180px; font-weight:900; cursor:pointer; border-radius:15px; font-size:15px; text-transform:uppercase; letter-spacing:1px; transition:0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Close Solutions
          </button>
      </div>
      <div class="panel-content scrollable" style="background:#f1f5f9; padding:30px;">
        <div style="max-width:900px; margin: 0 auto; display:grid; gap:25px;">
          ${questions.map((q, idx) => {
			const studentAns = (resData.studentAnswers || {})[q.questionId] || "";
			const correctAns = (q.options?.correctOption || "").trim();

			if (q.questionType === "NUMERICAL") {
				const isCorrect = parseFloat(studentAns) === parseFloat(correctAns) || studentAns.trim() === correctAns.trim();
				const isUnanswered = !studentAns || studentAns.trim() === "";

				return `
              <div class="exam-col" style="padding:40px; background:white; border-radius:28px; border:2px solid #ffffff; box-shadow:0 15px 35px rgba(0,0,0,0.05), 0 0 0 1px rgba(99, 102, 241, 0.05); transition:0.4s;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px;">
                  <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                       <span style="font-size:11px; font-weight:900; color:var(--primary); text-transform:uppercase; letter-spacing:2px; background:rgba(99, 102, 241, 0.1); padding:5px 12px; border-radius:8px;">Question ${idx + 1}</span>
                       <span style="font-size:13px; font-weight:800; color:var(--text-muted);">${q.marks} Points</span>
                       <span style="font-size:11px; font-weight:800; color:#db2777; background:#fce7f3; padding:5px 10px; border-radius:100px;">NUMERICAL</span>
                    </div>
                    <h2 style="margin:0; font-size:20px; line-height:1.6; color:var(--text-main); font-weight:800; white-space: pre-wrap; font-family: 'Consolas', monospace; background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">${q.questionText}</h2>
                    ${q.questionImage ? `<div style="margin-top:15px;"><img src="${q.questionImage}" style="max-height:250px; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,0.05);"></div>` : ""}
                  </div>
                  <div class="status-badge ${isUnanswered ? 'status-fail' : (isCorrect ? 'status-pass' : 'status-fail')}" style="padding:12px 28px; border-radius:100px; font-weight:900; font-size:12px; box-shadow:0 6px 15px rgba(0,0,0,0.08); text-transform:uppercase; letter-spacing:1px;">
                    ${isUnanswered ? 'Unattempted' : (isCorrect ? 'Correct Answer' : 'Incorrect Answer')}
                  </div>
                </div>
                
                <div style="margin-top:40px; padding:25px 30px; background:#f8fafc; border-radius:20px; border:2px dashed #e2e8f0; display:flex; flex-wrap:wrap; gap:60px; font-size:15px; position:relative;">
                   <div>
                     <div style="color:var(--text-muted); font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Your Answer</div>
                     <div style="color:${isCorrect ? '#10b981' : '#f43f5e'}; font-size:24px; font-weight:900; font-family: 'Consolas', monospace;">${studentAns || 'Skipped'}</div>
                   </div>
                   <div>
                     <div style="color:var(--text-muted); font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Correct Answer</div>
                     <div style="color:#10b981; font-size:24px; font-weight:900; font-family: 'Consolas', monospace;">${correctAns}</div>
                   </div>
                   <div style="position:absolute; top:-12px; left:30px; background:white; padding:0 12px; font-size:11px; font-weight:900; color:var(--primary); letter-spacing:1px; border:2px solid #e2e8f0; border-radius:100px;">VERIFICATION SUMMARY</div>
                </div>
              </div>
            `;
			}

			const studentList = studentAns.split(",").map(s => s.trim()).filter(x => x);
			const correctList = correctAns.split(",").map(s => s.trim()).filter(x => x);

			const isCorrect = studentList.length > 0 &&
				studentList.length === correctList.length &&
				studentList.every(s => correctList.includes(s));

			const isUnanswered = studentList.length === 0;

			return `
              <div class="exam-col" style="padding:40px; background:white; border-radius:28px; border:2px solid #ffffff; box-shadow:0 15px 35px rgba(0,0,0,0.05), 0 0 0 1px rgba(99, 102, 241, 0.05); transition:0.4s;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px;">
                  <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                       <span style="font-size:11px; font-weight:900; color:var(--primary); text-transform:uppercase; letter-spacing:2px; background:rgba(99, 102, 241, 0.1); padding:5px 12px; border-radius:8px;">Question ${idx + 1}</span>
                       <span style="font-size:13px; font-weight:800; color:var(--text-muted);">${q.marks} Points</span>
                    </div>
                    <h2 style="margin:0; font-size:20px; line-height:1.6; color:var(--text-main); font-weight:800; white-space: pre-wrap; font-family: 'Consolas', monospace; background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">${q.questionText}</h2>
                    ${q.questionImage ? `<div style="margin-top:15px;"><img src="${q.questionImage}" style="max-height:250px; border-radius:10px; box-shadow:0 5px 15px rgba(0,0,0,0.05);"></div>` : ""}
                  </div>
                  <div class="status-badge ${isUnanswered ? 'status-fail' : (isCorrect ? 'status-pass' : 'status-fail')}" style="padding:12px 28px; border-radius:100px; font-weight:900; font-size:12px; box-shadow:0 6px 15px rgba(0,0,0,0.08); text-transform:uppercase; letter-spacing:1px;">
                    ${isUnanswered ? 'Unattempted' : (isCorrect ? 'Correct Submission' : 'Incorrect Choice')}
                  </div>
                </div>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:12px;">
                  ${(q.options?.choices || []).map(opt => {
				const optTrim = opt.trim();
				const isRight = correctList.includes(optTrim);
				const isChosen = studentList.includes(optTrim);

				let stateCls = "";
				let icon = "○";
				if (isRight) { stateCls = "background:#ecfdf5; border-color:#10b981; color:#064e3b; border-width: 3px; transform:scale(1.05); z-index:2; border-left: 10px solid #10b981;"; icon = "✅ (CORRECT)"; }
				else if (isChosen) { stateCls = "background:#fff1f2; border-color:#f43f5e; color:#9f1239; border-width: 3px; border-left: 10px solid #f43f5e;"; icon = "❌ (YOUR ERROR)"; }
				else { stateCls = "background:#f8fafc; border-color:#e2e8f0; color:#64748b;"; }

				const optImg = (q.options?.choiceImages || [])[q.options.choices.indexOf(opt)];

				return `
                      <div style="padding:14px 18px; border-radius:10px; border:2px solid; font-weight:600; font-size:14px; display:flex; flex-direction:column; gap:12px; ${stateCls}">
                        <div style="display:flex; align-items:center; gap:12px;">
                           <span style="font-size:16px;">${icon}</span>
                           ${opt}
                        </div>
                        ${optImg ? `<div><img src="${optImg}" style="max-height:100px; border-radius:5px;"></div>` : ""}
                      </div>
                    `;
			}).join("")}
                </div>
                
                <div style="margin-top:40px; padding:25px 30px; background:#f8fafc; border-radius:20px; border:2px dashed #e2e8f0; display:flex; flex-wrap:wrap; gap:60px; font-size:15px; position:relative;">
                   <div>
                     <div style="color:var(--text-muted); font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Student Selection</div>
                     <div style="color:${isCorrect ? '#10b981' : '#f43f5e'}; font-size:18px; font-weight:900;">${studentAns || 'Skipped'}</div>
                   </div>
                   <div>
                     <div style="color:var(--text-muted); font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Benchmark Key</div>
                     <div style="color:#10b981; font-size:18px; font-weight:900;">${correctAns}</div>
                   </div>
                   <div style="position:absolute; top:-12px; left:30px; background:white; padding:0 12px; font-size:11px; font-weight:900; color:var(--primary); letter-spacing:1px; border:2px solid #e2e8f0; border-radius:100px;">VERIFICATION SUMMARY</div>
                </div>
              </div>
            `;
		}).join("")}
        </div>
      </div>
    `;
		document.body.appendChild(overlay);

		overlay.querySelector("#closeSolver").onclick = () => {
			overlay.remove();
			const listModal = document.getElementById("studentModalOverlay");
			if (listModal) listModal.style.visibility = "visible";
		};
	};

	function init() {
		getRoll(); // Populate local studentRoll from session if present
	}

	init();
})();