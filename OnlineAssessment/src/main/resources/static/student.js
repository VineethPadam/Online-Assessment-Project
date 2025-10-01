(() => {
    const takeQuizBtn = document.getElementById("takeQuizBtn");
    const viewResultBtn = document.getElementById("viewResultBtn");

    let quizContainer = null;
    let studentRoll = "";
    let modal = null;

    // -------------------- SET STUDENT ROLL --------------------
    window.setStudentRoll = (roll) => {
        studentRoll = roll;
    };

    // -------------------- CREATE MODAL --------------------
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
            modal.querySelector("#modalBody").innerHTML = "";
            modal.querySelector("#modalFooter").innerHTML = "";
        });
    }

    // -------------------- TAKE QUIZ --------------------
    takeQuizBtn.addEventListener("click", () => {
        if (!studentRoll) return alert("Please login first.");
        createModal();
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
        modalFooter.innerHTML = `<button id="fetchQuizzesBtn" class="login-btn">Fetch Quizzes</button>`;
        modal.classList.remove("hidden");

        document.getElementById("fetchQuizzesBtn").addEventListener("click", fetchQuizzes);
    }

    // -------------------- FETCH QUIZZES --------------------
    async function fetchQuizzes() {
        const dept = document.getElementById("quizDept").value;
        const year = document.getElementById("quizYear").value;
        const section = document.getElementById("quizSection").value;

        if (!dept || !year || !section) return alert("Please select Department, Year, and Section.");

        const modalHeader = modal.querySelector("#modalHeader");
        const modalBody = modal.querySelector("#modalBody");
        const modalFooter = modal.querySelector("#modalFooter");

        try {
            const res = await fetch(`/quiz/active?department=${dept}&year=${year}&section=${section}`);
            if (!res.ok) throw new Error(await res.text());
            const quizzes = await res.json();

            if (quizzes.length === 0) {
                modalHeader.textContent = "No Activated Quizzes";
                modalBody.innerHTML = "<p>No quizzes are currently activated for your selection.</p>";
                modalFooter.innerHTML = `<button class="login-btn" id="modalOkBtn">OK</button>`;
                document.getElementById("modalOkBtn").addEventListener("click", () => modal.classList.add("hidden"));
                return;
            }

            modalHeader.textContent = "Select a Quiz";
            modalBody.innerHTML = `<ul id="quizListUL"></ul>`;
            const quizListUL = document.getElementById("quizListUL");

            quizzes.forEach(q => {
                const li = document.createElement("li");
                li.textContent = `${q.quiz.quizId} - ${q.quiz.quizName}`;
                li.style.cursor = "pointer";
                li.addEventListener("click", () => openQuiz(q.quiz.quizId, q.quiz.quizName, dept, year, section));
                quizListUL.appendChild(li);
            });

            modalFooter.innerHTML = "";
        } catch (err) {
            alert("Error fetching quizzes: " + err.message);
        }
    }

    // -------------------- OPEN QUIZ --------------------
    async function openQuiz(quizId, quizName, department, year, section) {
        if (!studentRoll) return;

        try {
            const attemptRes = await fetch(`/results/student/attempted?rollNumber=${studentRoll}&quizId=${quizId}`);
            if (!attemptRes.ok) throw new Error(await attemptRes.text());
            const attempted = await attemptRes.json();

            if (attempted) {
                createModal();
                const modalHeader = modal.querySelector("#modalHeader");
                const modalBody = modal.querySelector("#modalBody");
                const modalFooter = modal.querySelector("#modalFooter");

                modalHeader.textContent = "⚠️ Quiz Already Attempted";
                modalBody.innerHTML = "<p>You have already attempted this quiz. You cannot retake it.</p>";
                modalFooter.innerHTML = `<button class="login-btn" id="okBtn">OK</button>`;
                modal.classList.remove("hidden");

                document.getElementById("okBtn").addEventListener("click", () => {
                    modal.classList.add("hidden");
                });
                return;
            }
        } catch (err) {
            alert("Error checking quiz attempt: " + err.message);
            return;
        }

        try {
            const res = await fetch(`/quiz/${quizId}/questions/for-student?department=${department}&year=${year}&section=${section}`);
            if (!res.ok) throw new Error(await res.text());
            const questions = await res.json();
            if (!questions || questions.length === 0) return alert("No questions found for this quiz.");

            modal.classList.add("hidden");
            if (quizContainer) quizContainer.remove();
            quizContainer = document.createElement("div");
            quizContainer.id = "quizContainer";
            quizContainer.className = "quiz-container show";

            // Header
            const header = document.createElement("div");
            header.className = "quiz-header";
            header.textContent = "MITS Online Quiz";
            quizContainer.appendChild(header);

            // Quiz Info
            const infoGrid = document.createElement("div");
            infoGrid.className = "quiz-info";
            [
                ["Quiz ID", quizId],
                ["Quiz Name", quizName],
                ["Roll Number", studentRoll],
                ["Year", year],
                ["Department", department],
                ["Section", section]
            ].forEach(([key, val]) => {
                const div = document.createElement("div");
                div.innerHTML = `<strong>${key}:</strong> ${val}`;
                infoGrid.appendChild(div);
            });
            quizContainer.appendChild(infoGrid);

            // Questions
            questions.forEach((q, idx) => {
                const qDiv = document.createElement("div");
                qDiv.className = "quiz-question";
                qDiv.innerHTML = `<p class="question-text">${idx + 1}. ${q.questionText}</p>`;

                const optsDiv = document.createElement("div");
                optsDiv.className = "quiz-options";

                const o = q.options || {};
                ["option1", "option2", "option3", "option4"].forEach(optKey => {
                    if (o[optKey]) {
                        const label = document.createElement("label");
                        label.className = "option-card";

                        const input = document.createElement("input");
                        input.type = "radio";
                        input.name = q.questionId;
                        input.value = optKey;

                        input.addEventListener("change", () => {
                            optsDiv.querySelectorAll(".option-card").forEach(l => l.classList.remove("selected"));
                            label.classList.add("selected");
                        });

                        label.appendChild(input);
                        label.appendChild(document.createTextNode(o[optKey]));
                        optsDiv.appendChild(label);
                    }
                });

                qDiv.appendChild(optsDiv);
                quizContainer.appendChild(qDiv);
            });

            // Buttons
            const btnDiv = document.createElement("div");
            btnDiv.style.marginTop = "20px";

            const submitBtn = document.createElement("button");
            submitBtn.textContent = "Submit";
            submitBtn.className = "login-btn";
            submitBtn.addEventListener("click", submitQuiz);

            const backBtn = document.createElement("button");
            backBtn.textContent = "Back";
            backBtn.className = "back-btn";
            backBtn.addEventListener("click", () => {
                quizContainer.remove();
            });

            btnDiv.appendChild(submitBtn);
            btnDiv.appendChild(backBtn);
            quizContainer.appendChild(btnDiv);

            document.body.appendChild(quizContainer);

        } catch (err) {
            alert("Error opening quiz: " + err.message);
        }
    }

    // -------------------- SUBMIT QUIZ --------------------
    async function submitQuiz() {
        if (!studentRoll) return;

        const answers = {};
        quizContainer.querySelectorAll(".quiz-question").forEach(qDiv => {
            const selected = qDiv.querySelector("input:checked");
            const qName = qDiv.querySelector("input")?.name;
            if (qName) answers[qName] = selected ? selected.parentElement.textContent.trim() : "";
        });

        const quizId = quizContainer.querySelector(".quiz-info div").textContent.split(":")[1].trim();

        try {
            const res = await fetch("/results/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rollNumber: studentRoll, quizId, answers })
            });

            if (!res.ok) throw new Error(await res.text());

            createModal();
            const modalHeader = modal.querySelector("#modalHeader");
            const modalBody = modal.querySelector("#modalBody");
            const modalFooter = modal.querySelector("#modalFooter");

            modalHeader.textContent = "🎉 Quiz Submitted Successfully!";
            modalBody.innerHTML = "<p>Your answers have been submitted successfully.</p>";
            modalFooter.innerHTML = `<button class="login-btn" id="okBtn">OK</button>`;
            modal.classList.remove("hidden");

            document.getElementById("okBtn").addEventListener("click", () => modal.classList.add("hidden"));

        } catch (err) {
            alert("Error submitting quiz: " + err.message);
        }
    }

    // -------------------- VIEW RESULT + VIEW KEY --------------------
    viewResultBtn.addEventListener("click", () => {
        if (!studentRoll) return alert("Please login first.");
        createModal();
        const modalHeader = modal.querySelector("#modalHeader");
        const modalBody = modal.querySelector("#modalBody");
        const modalFooter = modal.querySelector("#modalFooter");

        modalHeader.textContent = "View Quiz Result";
        modalBody.innerHTML = `<input id="resultQuizId" placeholder="Enter Quiz ID" class="login-input"/>`;
        modalFooter.innerHTML = `<button class="login-btn" id="fetchResultBtn">Fetch Result</button>`;
        modal.classList.remove("hidden");

        document.getElementById("fetchResultBtn").addEventListener("click", async () => {
            const quizId = document.getElementById("resultQuizId").value.trim();
            if (!quizId) return alert("Please enter a Quiz ID");

            try {
                const res = await fetch(`/results/student?rollNumber=${studentRoll}&quizId=${quizId}`);
                if (!res.ok) throw new Error(await res.text());
                const results = await res.json();
                if (results.length === 0) return alert("No results found for this quiz.");

                const result = results[0];
                modalHeader.textContent = "Quiz Result";

                modalBody.innerHTML = `
                    <table class="result-table">
                        <tr><th>Quiz ID</th><td>${result.quiz.quizId}</td></tr>
                        <tr><th>Quiz Name</th><td>${result.quiz.quizName}</td></tr>
                        <tr><th>Roll Number</th><td>${result.student.studentRollNumber}</td></tr>
                        <tr><th>Score</th><td>${result.score}</td></tr>
                    </table>
                `;

                modalFooter.innerHTML = `
                    <button class="login-btn" id="viewKeyBtn">View Key</button>
                    <button class="login-btn" id="okResultBtn">OK</button>
                `;

                document.getElementById("okResultBtn").addEventListener("click", () => modal.classList.add("hidden"));

                // -------------------- VIEW KEY --------------------
                document.getElementById("viewKeyBtn").addEventListener("click", async () => {
                    try {
                        const keyRes = await fetch(`/answerkey/${quizId}/${studentRoll}`);
                        if (!keyRes.ok) throw new Error(await keyRes.text());
                        const keyData = await keyRes.json();

                        modalHeader.textContent = "Answer Key";
                        modalBody.innerHTML = `<div class="key-container"></div>`;
                        const keyContainer = modalBody.querySelector(".key-container");

                        keyData.forEach((q, idx) => {
                            const qDiv = document.createElement("div");
                            qDiv.className = "quiz-question";
                            qDiv.innerHTML = `<p class="question-text">${idx + 1}. ${q.questionText}</p>`;

                            const optsDiv = document.createElement("div");
                            optsDiv.className = "quiz-options";

                            ["option1", "option2", "option3", "option4"].forEach(optKey => {
                                const optText = q[optKey];
                                if (!optText) return;

                                const div = document.createElement("div");
                                div.className = "option-card key-card";

                                if (optText === q.correctOption && optText === q.selectedOption) div.classList.add("correct-selected");
                                else if (optText === q.correctOption) div.classList.add("correct");
                                else if (optText === q.selectedOption) div.classList.add("wrong-selected");
                                else div.classList.add("not-attempted");

                                div.textContent = optText;
                                optsDiv.appendChild(div);
                            });

                            qDiv.appendChild(optsDiv);
                            keyContainer.appendChild(qDiv);
                        });

                        modalFooter.innerHTML = `<button class="login-btn" id="closeKeyBtn">Close</button>`;
                        document.getElementById("closeKeyBtn").addEventListener("click", () => modal.classList.add("hidden"));

                    } catch (err) {
                        alert("Error fetching answer key: " + err.message);
                    }
                });

            } catch (err) {
                alert("Error fetching result: " + err.message);
            }
        });
    });
})();
