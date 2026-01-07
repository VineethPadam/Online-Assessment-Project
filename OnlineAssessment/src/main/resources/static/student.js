(() => {
    const takeQuizBtn = document.getElementById("takeQuizBtn");
    const viewResultBtn = document.getElementById("viewResultBtn");
    const leftMenu = document.getElementById("leftMenu"); 
    let quizContainer = null;
    let studentRoll = "";
    let modal = null;
    let lastModalContent = null;

    // ✅ Added global control variables
    let examActive = false;
    let blurCount = 0;
    let timerInterval = null;
	let isSubmitted = false;

    window.setStudentRoll = (roll) => studentRoll = roll;

    // -------------------- HELPERS --------------------
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    function mulberry32(a) {
        return function() {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    function shuffleArray(array, seed = null) {
        let arr = [...array];
        let random = seed !== null ? mulberry32(seed) : Math.random;
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function createModal() {
        if (modal) return;
        modal = document.createElement("div");
        modal.id = "studentModal";
        modal.className = "modal hidden";
        modal.innerHTML = `
            <div class="modal-content">
                <span id="modalClose" class="close">&times;</span>
                <div class="modal-header" id="modalHeader"></div>
                <div class="modal-body" id="modalBody"></div>
                <div class="modal-footer" id="modalFooter"></div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector("#modalClose").addEventListener("click", () => {
            modal.classList.add("hidden");
            if (leftMenu) leftMenu.style.display = "flex";
        });
    }

    function saveModalState() {
        if (!modal) return;
        lastModalContent = {
            header: modal.querySelector("#modalHeader").innerHTML,
            body: modal.querySelector("#modalBody").innerHTML,
            footer: modal.querySelector("#modalFooter").innerHTML
        };
    }

    function restoreModalState() {
        if (!lastModalContent) return;
        modal.querySelector("#modalHeader").innerHTML = lastModalContent.header;
        modal.querySelector("#modalBody").innerHTML = lastModalContent.body;
        modal.querySelector("#modalFooter").innerHTML = lastModalContent.footer;
        modal.classList.remove("hidden");
        lastModalContent = null;
        if (leftMenu) leftMenu.style.display = "flex";
    }

    // -------------------- TAKE QUIZ --------------------
    takeQuizBtn.addEventListener("click", () => {
        if (!studentRoll) return alert("Please login first.");
        if (leftMenu) leftMenu.style.display = "none";
        createModal();
        saveModalState();
        openTakeQuizModal();
    });

    function openTakeQuizModal() {
        const modalHeader = modal.querySelector("#modalHeader");
        const modalBody = modal.querySelector("#modalBody");
        const modalFooter = modal.querySelector("#modalFooter");

        modalHeader.textContent = "Select Department, Year, Section";
        modalBody.innerHTML = `
            <select id="quizDept">
                <option value="">Select Department</option>
                <option value="CSE">CSE</option>
				<option value="CST">CST</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
            </select>
            <select id="quizYear">
                <option value="">Select Year</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
            </select>
            <select id="quizSection">
                <option value="">Select Section</option>
                ${["A","B","C","D","E","F","G","H","I","J"].map(s=>`<option value="${s}">${s}</option>`).join("")}
            </select>
        `;
        modalFooter.innerHTML = `<button class="login-btn" id="fetchQuizzesBtn">Fetch Quizzes</button>`;
        modal.classList.remove("hidden");

        document.getElementById("fetchQuizzesBtn").addEventListener("click", fetchQuizzes);
    }

    async function fetchQuizzes() {
        const dept = document.getElementById("quizDept").value;
        const year = document.getElementById("quizYear").value;
        const section = document.getElementById("quizSection").value;
        if (!dept || !year || !section) return alert("Select all fields.");

        const modalHeader = modal.querySelector("#modalHeader");
        const modalBody = modal.querySelector("#modalBody");
        const modalFooter = modal.querySelector("#modalFooter");

        try {
			const res = await fetch(
			  `/quiz/active?rollNumber=${studentRoll}&department=${dept}&year=${year}&section=${section}`
			);
			
			if (res.status === 401) {
			    alert("Invalid credentials");
			    modal.classList.add("hidden");
			    if (leftMenu) leftMenu.style.display = "flex";
			    return;
			}
			
            if (!res.ok) throw new Error(await res.text());
            const quizzes = await res.json();

            if (quizzes.length === 0) {
                modalHeader.textContent = "No Activated Quizzes";
                modalBody.innerHTML = "<p>No quizzes are active for your selection.</p>";
                modalFooter.innerHTML = `<button class="login-btn" id="modalOkBtn">OK</button>`;
                document.getElementById("modalOkBtn").addEventListener("click", () => {
                    modal.classList.add("hidden");
                    if (leftMenu) leftMenu.style.display = "flex";
                });
                return;
            }

            modalHeader.textContent = "Select a Quiz";
            modalBody.innerHTML = `<ul id="quizListUL"></ul>`;
            const quizListUL = document.getElementById("quizListUL");

            quizzes.forEach(q => {
                const li = document.createElement("li");
                li.textContent = `${q.quiz.quizId} - ${q.quiz.quizName}`;
                li.addEventListener("click", async () => {
                    try {
                        const attemptedRes = await fetch(`/results/student/attempted?rollNumber=${studentRoll}&quizId=${q.quiz.quizId}`);
                        const alreadyAttempted = await attemptedRes.json();

                        if (alreadyAttempted) {
                            saveModalState();
                            modalHeader.textContent = "⚠️ Quiz Already Attempted";
                            modalBody.innerHTML = `<p>You have already attempted this quiz.</p>`;
                            modalFooter.innerHTML = `<button class="back-btn" id="closeModalBtn">OK</button>`;
                            document.getElementById("closeModalBtn").addEventListener("click", () => {
                                modal.classList.add("hidden");
                                if (leftMenu) leftMenu.style.display = "flex";
                            });
                            return;
                        }

                        // Show confirmation modal
                        saveModalState();
                        modalHeader.textContent = "Confirm Quiz Start";
                        modalBody.innerHTML = `<p>Would you like to take the quiz: <strong>${q.quiz.quizName}</strong>?</p>
                                               <p style="color: #ff6600; font-weight: bold;">Note: Once you proceed, a 30-second preparation countdown will begin.</p>`;
                        modalFooter.innerHTML = `<button class="back-btn" id="cancelQuizBtn">Cancel</button>
                                                 <button class="login-btn" id="proceedQuizBtn">Proceed</button>`;

                        document.getElementById("cancelQuizBtn").addEventListener("click", () => {
                            modal.classList.add("hidden");
                            if (leftMenu) leftMenu.style.display = "flex";
                        });

                        document.getElementById("proceedQuizBtn").addEventListener("click", () => {
                            // Request full screen immediately on user click
                            enterFullScreen();
                            
                            // Start 30-second countdown
                            modalHeader.textContent = "Preparation Time";
                            modalBody.innerHTML = `<p>Get ready! The quiz will start in:</p>
                                                   <div style="font-size: 48px; font-weight: bold; color: #ff6600; text-align: center;" id="countdownTimer">30</div>`;
                            modalFooter.innerHTML = "";

                            let countdown = 30;
                            const countdownInterval = setInterval(() => {
                                countdown--;
                                document.getElementById("countdownTimer").textContent = countdown;
                                if (countdown <= 0) {
                                    clearInterval(countdownInterval);
                                    modal.classList.add("hidden");
                                    openQuiz(q.quiz.quizId, q.quiz.quizName, dept, year, section, q.durationMinutes);
                                }
                            }, 1000);
                        });

                    } catch (err) {
                        alert("Error checking attempts: " + err.message);
                    }
                });
                quizListUL.appendChild(li);
            });
            modalFooter.innerHTML = "";

        } catch (err) {
            alert("Error: " + err.message);
        }
    }

    // -------------------- OPEN QUIZ --------------------
	async function openQuiz(quizId, quizName, dept, year, section, durationMinutes) {
	    if (!studentRoll) return;
	    modal.classList.add("hidden");
	    // enterFullScreen(); // Moved to proceed button click

	    try {
	        const res = await fetch(`/quiz/${quizId}/questions/for-student?department=${dept}&year=${year}&section=${section}`);
	        if (!res.ok) throw new Error(await res.text());
	        let questions = await res.json();
	        if (!questions || questions.length === 0) return alert("No questions found");

	        examActive = true;
	        blurCount = 0;
			isSubmitted = false;

	        setupTabProtection();
	        disableCopy();

	        const seed = hashString(studentRoll + quizId);
	        questions = shuffleArray(questions, seed);

	        quizContainer?.remove();
	        quizContainer = document.createElement("div");
	        quizContainer.className = "overlay-center";

	        const inner = document.createElement("div");
	        inner.className = "quiz-container";

	        // HEADER
	        const header = document.createElement("div");
	        header.className = "quiz-header";
	        header.textContent = "MITS Online Quiz";
	        inner.appendChild(header);

	        // TIMER
	        let timerDiv = null;
	        //let timerInterval = null;
	        if (durationMinutes > 0) {
	            timerDiv = document.createElement("div");
	            timerDiv.className = "quiz-timer";
	            timerDiv.textContent = `Time Remaining: ${durationMinutes}:00`;
	            inner.appendChild(timerDiv);

	            let remainingSeconds = durationMinutes * 60;
	            timerInterval = setInterval(() => {
	                remainingSeconds--;
	                const mins = Math.floor(remainingSeconds / 60);
	                const secs = remainingSeconds % 60;
	                timerDiv.textContent = `Time Remaining: ${mins}:${secs.toString().padStart(2, '0')}`;
	                if (remainingSeconds <= 0) {
	                    clearInterval(timerInterval);
	                    submitQuiz();
	                }
	            }, 1000);
	        }

	        const infoGrid = document.createElement("div");
	        infoGrid.className = "quiz-info";
	        [["Quiz ID", quizId], ["Quiz Name", quizName], ["Roll Number", studentRoll], ["Year", year], ["Department", dept], ["Section", section]].forEach(([k, v]) => {
	            const div = document.createElement("div");
	            div.innerHTML = `<strong>${k}:</strong> ${v}`;
	            infoGrid.appendChild(div);
	        });
	        inner.appendChild(infoGrid);

	        // MAIN BODY (LEFT + RIGHT)
	        const bodyDiv = document.createElement("div");
	        bodyDiv.className = "quiz-body";

	        // LEFT SIDE - Question Area
			// LEFT SIDE - Question Area
			const questionArea = document.createElement("div");
			questionArea.className = "question-area";

			const questionScroll = document.createElement("div");
			questionScroll.className = "question-scroll";
			questionArea.appendChild(questionScroll);


	        // RIGHT SIDE - Navigation Panel
	        const navPanel = document.createElement("div");
	        navPanel.className = "question-nav";
	        navPanel.innerHTML = `<h3>Question Panel</h3>`;
	        const navGrid = document.createElement("div");
	        navGrid.className = "question-grid";
	        navPanel.appendChild(navGrid);

	        let currentIndex = 0;
	        const questionDivs = [];

	        for (let idx = 0; idx < questions.length; idx++) {
	            const q = questions[idx];
	            const multiRes = await fetch(`/quiz/questions/${q.questionId}/is-multiple`);
	            const isMultiple = await multiRes.json();

	            const qDiv = document.createElement("div");
	            qDiv.className = "quiz-question";
	            qDiv.style.display = idx === 0 ? "block" : "none";
	            qDiv.innerHTML = `<p class="question-text">${idx + 1}. ${q.questionText}</p>`;

	            const optsDiv = document.createElement("div");
	            optsDiv.className = "quiz-options";

	            let opts = [];
	            ["option1", "option2", "option3", "option4"].forEach(optKey => {
	                if (q.options[optKey]) opts.push({ key: optKey, text: q.options[optKey] });
	            });
	            opts = shuffleArray(opts, seed + idx);

	            opts.forEach(opt => {
	                const label = document.createElement("label");
	                label.className = "option-card";
	                const input = document.createElement("input");
	                input.type = isMultiple ? "checkbox" : "radio";
	                input.name = q.questionId;
	                input.value = opt.key;

	                input.addEventListener("change", () => {
	                    if (!isMultiple)
	                        optsDiv.querySelectorAll(".option-card").forEach(l => l.classList.remove("selected"));
	                    label.classList.toggle("selected");

	                    // Mark answered in panel
	                    const btn = navGrid.querySelector(`[data-idx="${idx}"]`);
	                    if (btn) btn.classList.add("answered");
	                });

	                label.appendChild(input);
	                label.appendChild(document.createTextNode(opt.text));
	                optsDiv.appendChild(label);
	            });

	            qDiv.appendChild(optsDiv);
				questionScroll.appendChild(qDiv);
	            questionDivs.push(qDiv);

	            // Nav Button
	            const navBtn = document.createElement("button");
	            navBtn.textContent = idx + 1;
	            navBtn.dataset.idx = idx;
	            navBtn.className = "nav-btn";
	            navBtn.addEventListener("click", () => {
	                questionDivs.forEach(div => (div.style.display = "none"));
	                questionDivs[idx].style.display = "block";
	                currentIndex = idx;
	                highlightNavButton();
	            });
	            navGrid.appendChild(navBtn);
	        }

	        function highlightNavButton() {
	            navGrid.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
	            const activeBtn = navGrid.querySelector(`[data-idx="${currentIndex}"]`);
	            if (activeBtn) activeBtn.classList.add("active");
	        }
	        highlightNavButton();

	        // CONTROL BUTTONS
	        const btnDiv = document.createElement("div");
	        btnDiv.className = "quiz-controls";

	        const prevBtn = document.createElement("button");
	        prevBtn.className = "back-btn";
	        prevBtn.textContent = "Previous";
	        prevBtn.addEventListener("click", () => {
	            if (currentIndex > 0) {
	                questionDivs[currentIndex].style.display = "none";
	                currentIndex--;
	                questionDivs[currentIndex].style.display = "block";
	                highlightNavButton();
	            }
	        });

	        const nextBtn = document.createElement("button");
	        nextBtn.className = "login-btn";
	        nextBtn.textContent = "Next";
	        nextBtn.addEventListener("click", () => {
	            if (currentIndex < questionDivs.length - 1) {
	                questionDivs[currentIndex].style.display = "none";
	                currentIndex++;
	                questionDivs[currentIndex].style.display = "block";
	                highlightNavButton();
	            }
	        });

	        const submitBtn = document.createElement("button");
	        submitBtn.className = "login-btn";
	        submitBtn.textContent = "Submit";
	        submitBtn.addEventListener("click", submitQuiz);

			// ---- create button groups ----
			const leftGroup = document.createElement("div");
			leftGroup.className = "left-buttons";
			leftGroup.appendChild(prevBtn);
			leftGroup.appendChild(nextBtn);

			const rightGroup = document.createElement("div");
			rightGroup.className = "right-buttons";
			rightGroup.appendChild(submitBtn);

			// ---- add groups to main control bar ----
			btnDiv.appendChild(leftGroup);
			btnDiv.appendChild(rightGroup);
			questionArea.appendChild(btnDiv);


	        bodyDiv.appendChild(questionArea);
	        bodyDiv.appendChild(navPanel);
	        inner.appendChild(bodyDiv);
	        quizContainer.appendChild(inner);
	        document.body.appendChild(quizContainer);

	    } catch (err) {
	        alert("Error opening quiz: " + err.message);
	    }
	}

	// -------------------- SUBMIT QUIZ --------------------
	async function submitQuiz() {
	    // ✅ Stop exam protection and fullscreen
		if (isSubmitted) return;   // 🔒 STOP DOUBLE SUBMIT
		    isSubmitted = true;
	    examActive = false;
	    if (timerInterval) {
	        clearInterval(timerInterval);
	        timerInterval = null;
	    }
	    removeTabProtection();
	    enableCopy(); // ✅ Re-enable copy/paste after quiz ends

	    // ✅ Remove any leftover "continue exam" overlays
	    document.querySelectorAll("#continueExamBtn, #exitExamBtn").forEach(btn => {
	        const overlay = btn.closest("div[style*='position: fixed']");
	        if (overlay) overlay.remove();
	    });

	    const answers = {};
	    quizContainer?.querySelectorAll(".quiz-question").forEach(qDiv => {
	        const qId = qDiv.querySelector("input")?.name;
	        if (!qId) return;
	        const selected = Array.from(qDiv.querySelectorAll("input:checked"))
	            .map(i => i.value)
	            .join(",");
	        answers[qId] = selected;
	        localStorage.removeItem("quizState");
	    });

	    const quizId = quizContainer?.querySelector(".quiz-info div")?.textContent.split(":")[1].trim();
	    try {
	        const res = await fetch("/results/submit", {
	            method: "POST",
	            headers: { "Content-Type": "application/json" },
	            body: JSON.stringify({ rollNumber: studentRoll, quizId, answers })
	        });
	        if (!res.ok) throw new Error(await res.text());

	        quizContainer?.remove();
	        if (document.fullscreenElement) document.exitFullscreen();

	        // ✅ Show only final success modal
	        modal.querySelector("#modalHeader").textContent = "✅ Quiz Submitted Successfully!";
	        modal.querySelector("#modalBody").innerHTML = "<p>Your answers have been submitted.</p>";
	        modal.querySelector("#modalFooter").innerHTML = `<button class="back-btn" id="submitOkBtn">OK</button>`;
	        modal.classList.remove("hidden");

	        document.getElementById("submitOkBtn").addEventListener("click", () => {
	            if (leftMenu) leftMenu.style.display = "flex";
	            modal.classList.add("hidden");
	        });

	    } catch (err) {
	        alert("Error submitting: " + err.message);
	    }
	}


    // -------------------- TAB PROTECTION --------------------
    function setupTabProtection() {
        removeTabProtection();
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);
    }

    function removeTabProtection() {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleWindowBlur);
    }

    function handleVisibilityChange() {
        if (document.hidden && examActive) {
            blurCount++;
            if (blurCount >= 2) {
                alert("🚨 You switched tabs too many times! Submitting quiz...");
                examActive = false;
                removeTabProtection();
                submitQuiz();
            } else {
                alert(`⚠️ Warning ${blurCount}/2: Don’t switch tabs or minimize.`);
            }
        }
    }

    function handleWindowBlur() {
        if (!examActive) return;
        setTimeout(() => {
            if (!document.hidden && examActive) return;
            blurCount++;
            if (blurCount >= 5) {
                alert("🚨 You switched tabs too many times! Submitting quiz...");
                examActive = false;
                removeTabProtection();
                submitQuiz();
            }
        }, 300);
    }

	// -------------------- COPY / PASTE PROTECTION --------------------
	function disableCopy() {
	    document.addEventListener("copy", blockEvent);
	    document.addEventListener("cut", blockEvent);
	    document.addEventListener("paste", blockEvent);
	    document.addEventListener("contextmenu", blockEvent);
	    document.addEventListener("selectstart", blockEvent);
	    document.addEventListener("keydown", blockKeyShortcuts);
	}

	function enableCopy() {
	    document.removeEventListener("copy", blockEvent);
	    document.removeEventListener("cut", blockEvent);
	    document.removeEventListener("paste", blockEvent);
	    document.removeEventListener("contextmenu", blockEvent);
	    document.removeEventListener("selectstart", blockEvent);
	    document.removeEventListener("keydown", blockKeyShortcuts);
	}

	function blockEvent(e) {
	    e.preventDefault();
	    return false;
	}

	function blockKeyShortcuts(e) {
	    if (
	        (e.ctrlKey && ["c","x","v","u","s"].includes(e.key.toLowerCase())) ||
	        (e.metaKey && ["c","x","v","u","s"].includes(e.key.toLowerCase())) ||
	        e.key === "PrintScreen"
	    ) {
	        e.preventDefault();
	        return false;
	    }
	}

    // -------------------- VIEW RESULT --------------------
    viewResultBtn.addEventListener("click", () => {
        if (!studentRoll) return alert("Please login first.");
        if (leftMenu) leftMenu.style.display = "none";
        createModal();
        saveModalState();
        fetchResult();
    });

    async function fetchResult() {
        const modalHeader = modal.querySelector("#modalHeader");
        const modalBody = modal.querySelector("#modalBody");
        const modalFooter = modal.querySelector("#modalFooter");

        modalHeader.textContent = "Enter Quiz ID";
        modalBody.innerHTML = `<input type="text" id="resultQuizId" placeholder="Quiz ID" />`;
        modalFooter.innerHTML = `<button class="login-btn" id="fetchResultBtn">View Result</button>`;
        modal.classList.remove("hidden");

        document.getElementById("fetchResultBtn").addEventListener("click", async () => {
            const quizId = document.getElementById("resultQuizId").value.trim();
			if (!quizId) {
			    modalHeader.textContent = "Missing Quiz ID";
			    modalBody.innerHTML = "<p>Please enter a valid Quiz ID to view your result.</p>";
			    modalFooter.innerHTML = `<button class="back-btn" id="okBtn">OK</button>`;
			    document.getElementById("okBtn").onclick = () => modal.classList.add("hidden");
			    return;
			}


            try {
                const res = await fetch(`/results/student?rollNumber=${studentRoll}&quizId=${quizId}`);
				if (!res.ok) {
				    modalHeader.textContent = "Invalid Quiz ID/Results not published";
				    modalBody.innerHTML = "<p>The Quiz ID you entered is invalid or results are not published.</p>";
				    modalFooter.innerHTML = `<button class="back-btn" id="okBtn">OK</button>`;
				    document.getElementById("okBtn").onclick = () => modal.classList.add("hidden");
				    return;
				}

                const results = await res.json();
				if (!results || results.length === 0) {
				    modalHeader.textContent = "Result Not Available";
				    modalBody.innerHTML = `
				        <p>Your result has not been published yet.</p>
				        <p style="color:#6a0dad;font-weight:600;">Please check again later.</p>
				    `;
				    modalFooter.innerHTML = `<button class="back-btn" id="okBtn">OK</button>`;
				    document.getElementById("okBtn").onclick = () => modal.classList.add("hidden");
				    return;
				}

                const r = results[0];
                modalHeader.textContent = "Quiz Result";
                modalBody.innerHTML = `
                    <p><strong>Roll Number:</strong> ${studentRoll}</p>
                    <p><strong>Quiz ID:</strong> ${r.quiz.quizId}</p>
                    <p><strong>Quiz Name:</strong> ${r.quiz.quizName}</p>
                    <p><strong>Score:</strong> ${r.score}</p>
                    <button class="login-btn" id="viewKeyBtnResult">View Answer Key</button>
                `;
                modalFooter.innerHTML = "";
                document.getElementById("viewKeyBtnResult").addEventListener("click", () => viewAnswerKey(quizId, studentRoll));

            } 	catch (err) {
				    modalHeader.textContent = "Unable to Fetch Result";
				    modalBody.innerHTML = `<p>${err.message}</p>`;
				    modalFooter.innerHTML = `<button class="back-btn" id="okBtn">OK</button>`;
				    document.getElementById("okBtn").onclick = () => modal.classList.add("hidden");
				}

        });
    }

    // -------------------- VIEW ANSWER KEY --------------------
	async function viewAnswerKey(quizId, rollNo) {
	        try {
	            const res = await fetch(`/answerkey/${quizId}/${rollNo}`);
	            if (!res.ok) throw new Error(await res.text());
	            const keyData = await res.json();

	            saveModalState();
	            modal.classList.add("hidden");
	            quizContainer?.remove();

	            quizContainer = document.createElement("div");
	            quizContainer.className = "overlay-center";

	            const inner = document.createElement("div");
	            inner.className = "key-container";
	            window.scrollTo({ top: 0, behavior: "auto" });

	            const header = document.createElement("div");
	            header.className = "quiz-header";
	            header.textContent = "Answer Key";
	            inner.appendChild(header);

	            keyData.forEach((q, idx) => {
	                const qDiv = document.createElement("div");
	                qDiv.className = "quiz-question";
	                qDiv.innerHTML = `<p class="question-text" style="white-space: pre-wrap;">${idx + 1}. ${q.questionText}</p>`;
	                const optsDiv = document.createElement("div");
	                optsDiv.className = "quiz-options";

	                ["option1","option2","option3","option4"].forEach(optKey => {
	                    if (!q[optKey]) return;
	                    const label = document.createElement("label"); 
	                    label.className = "option-card";
	                    label.style.whiteSpace = "pre-wrap";

	                    const isSelected = q.selectedOption?.split(",").includes(optKey);
	                    const isCorrect = q.correctOption?.split(",").includes(optKey);

	                    if (isSelected && isCorrect) label.classList.add("correct-selected");
	                    else if (isCorrect) label.classList.add("correct");
	                    else if (isSelected) label.classList.add("wrong-selected");

	                    label.textContent = q[optKey];
	                    optsDiv.appendChild(label);
	                });

	                qDiv.appendChild(optsDiv);
	                inner.appendChild(qDiv);
	            });

            const backBtn = document.createElement("button");
            backBtn.className = "back-btn";
            backBtn.textContent = "Back";
            backBtn.addEventListener("click", () => {
                quizContainer.remove();
                restoreModalState();
            });

            inner.appendChild(backBtn);
            quizContainer.appendChild(inner);
            document.body.appendChild(quizContainer);

        } catch (err) {
            alert("Error loading answer key: " + err.message);
        }
    }

    // -------------------- FULLSCREEN & CENTERING --------------------
    function enterFullScreen() {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
    }
	
	document.addEventListener("fullscreenchange", () => {
	    if (examActive && !document.fullscreenElement) {
	        // Create overlay confirmation UI
	        const overlay = document.createElement("div");
	        overlay.style.position = "fixed";
	        overlay.style.top = "0";
	        overlay.style.left = "0";
	        overlay.style.width = "100%";
	        overlay.style.height = "100%";
	        overlay.style.background = "rgba(0,0,0,0.6)";
	        overlay.style.display = "flex";
	        overlay.style.flexDirection = "column";
	        overlay.style.alignItems = "center";
	        overlay.style.justifyContent = "center";
	        overlay.style.zIndex = "10000";
	        overlay.innerHTML = `
	            <div style="background:white; padding:20px; border-radius:12px; text-align:center; width:350px; box-shadow:0 6px 20px rgba(0,0,0,0.3);">
	                <p style="font-size:16px; margin-bottom:20px;">⚠️ You exited fullscreen mode.<br><br>If you leave now, your quiz will be submitted.</p>
	                <div style="display:flex; justify-content:space-between; gap:10px;">
	                    <button id="continueExamBtn" class="login-btn" style="flex:1;">Continue Exam</button>
	                    <button id="exitExamBtn" class="back-btn" style="flex:1;">Submit & Exit</button>
	                </div>
	            </div>
	        `;
	        document.body.appendChild(overlay);

	        // ✅ User clicks to continue exam
	        document.getElementById("continueExamBtn").addEventListener("click", () => {
	            overlay.remove();
	            enterFullScreen(); // Works because it's a user click
	        });

	        // 🚫 User clicks to exit exam
	        document.getElementById("exitExamBtn").addEventListener("click", () => {
	            overlay.remove();
	            examActive = false;
	            removeTabProtection();
	            submitQuiz();
	        });
	    }
	});



})();
