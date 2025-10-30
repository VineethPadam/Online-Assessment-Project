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
            const res = await fetch(`/quiz/active?department=${dept}&year=${year}&section=${section}`);
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

                        openQuiz(q.quiz.quizId, q.quiz.quizName, dept, year, section);

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
    async function openQuiz(quizId, quizName, dept, year, section) {
        if (!studentRoll) return;
        modal.classList.add("hidden");

        // ✅ ENTER FULLSCREEN MODE
        enterFullScreen();

        try {
            const res = await fetch(`/quiz/${quizId}/questions/for-student?department=${dept}&year=${year}&section=${section}`);
            if (!res.ok) throw new Error(await res.text());
            let questions = await res.json();
            if (!questions || questions.length === 0) return alert("No questions found");

            // ✅ Tab protection setup
            examActive = true;
            blurCount = 0;
            setupTabProtection();
			disableCopy(); // 🚫 Disable copy, paste, right-click during quiz


            const seed = hashString(studentRoll + quizId);
            questions = shuffleArray(questions, seed);

            quizContainer?.remove();
            quizContainer = document.createElement("div");
            quizContainer.className = "overlay-center";

            const inner = document.createElement("div");
            inner.className = "quiz-container";
            window.scrollTo({ top: 0, behavior: "auto" });

            const header = document.createElement("div"); 
            header.className = "quiz-header"; 
            header.textContent = "MITS Online Quiz"; 
            inner.appendChild(header);

            const infoGrid = document.createElement("div"); 
            infoGrid.className = "quiz-info";
            [["Quiz ID", quizId], ["Quiz Name", quizName], ["Roll Number", studentRoll], ["Year", year], ["Department", dept], ["Section", section]].forEach(([k, v]) => {
                const div = document.createElement("div"); 
                div.innerHTML = `<strong>${k}:</strong> ${v}`; 
                infoGrid.appendChild(div);
            });
            inner.appendChild(infoGrid);

			const scrollArea = document.createElement("div");
			scrollArea.className = "quiz-scroll";

			for (let idx = 0; idx < questions.length; idx++) {
			    const q = questions[idx];
			    const multiRes = await fetch(`/quiz/questions/${q.questionId}/is-multiple`);
			    const isMultiple = await multiRes.json();

			    const qDiv = document.createElement("div");
			    qDiv.className = "quiz-question";
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
			        });

			        label.appendChild(input);
			        label.appendChild(document.createTextNode(opt.text));
			        optsDiv.appendChild(label);
			    });

			    qDiv.appendChild(optsDiv);
			    scrollArea.appendChild(qDiv);
			}

			inner.appendChild(scrollArea);


            const btnDiv = document.createElement("div"); 
            btnDiv.style.marginTop = "20px";
            const submitBtn = document.createElement("button"); 
            submitBtn.className = "login-btn"; 
            submitBtn.textContent = "Submit"; 
            submitBtn.addEventListener("click", submitQuiz);

            const backBtn = document.createElement("button"); 
            backBtn.className = "back-btn"; 
            backBtn.textContent = "Back";
			backBtn.addEventListener("click", () => {
			    // Create a confirmation overlay instead of alert
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
			            <p style="font-size:16px; margin-bottom:20px;">⚠️ Are you sure you want to exit the quiz?<br><br>Your progress will be lost.</p>
			            <div style="display:flex; justify-content:space-between; gap:10px;">
			                <button id="continueExamBtn" class="login-btn" style="flex:1;">Continue Exam</button>
			                <button id="exitExamBtn" class="back-btn" style="flex:1;">Submit & Exit</button>
			            </div>
			        </div>
			    `;
			    document.body.appendChild(overlay);

			    // Continue Exam
			    document.getElementById("continueExamBtn").addEventListener("click", () => {
			        overlay.remove();
			        enterFullScreen(); // Works fine because user clicked it
			    });

			    // Exit and Submit
			    document.getElementById("exitExamBtn").addEventListener("click", () => {
			        overlay.remove();
			        examActive = false;
			        removeTabProtection();
			        submitQuiz();
			    });
			});


            btnDiv.appendChild(submitBtn); 
            btnDiv.appendChild(backBtn);
            inner.appendChild(btnDiv);

            quizContainer.appendChild(inner);
            document.body.appendChild(quizContainer);
            centerOverlay(quizContainer);

        } catch (err) { alert("Error opening quiz: " + err.message); }
    }

    // -------------------- SUBMIT QUIZ --------------------
	// -------------------- SUBMIT QUIZ --------------------
	async function submitQuiz() {
	    // ✅ Stop exam protection and fullscreen
	    examActive = false;
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
            if (!quizId) return alert("Please enter a Quiz ID.");

            try {
                const res = await fetch(`/results/student?rollNumber=${studentRoll}&quizId=${quizId}`);
                if (!res.ok) throw new Error("Quiz not found");
                const results = await res.json();
                if (!results || results.length === 0) return alert("Result not published yet");

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

            } catch (err) {
                alert("Error: " + err.message);
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
            centerOverlay(quizContainer);

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
	

    function centerOverlay(el) {
        el.style.position = "fixed";
        el.style.top = "50%";
        el.style.left = "50%";
        el.style.transform = "translate(-50%, -50%)";
        el.style.zIndex = "9999";
        el.style.width = "90%";
        el.style.height = "90%";
        el.style.overflowY = "auto";
        el.style.backgroundColor = "#fff";
        el.style.padding = "20px";
        el.style.borderRadius = "10px";
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
