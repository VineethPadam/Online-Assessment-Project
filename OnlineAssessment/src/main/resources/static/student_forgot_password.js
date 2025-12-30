(() => {
    const forgotBtn = document.getElementById("studentForgotPasswordBtn");
    if (!forgotBtn) return;

    const modal = document.createElement("div");
    modal.id = "studentModal";
    modal.className = "faculty-modal hidden";
    modal.innerHTML = `
        <div class="faculty-modal-content">
            <span class="close" id="studentModalClose">&times;</span>
            <div class="faculty-modal-header" id="studentModalHeader"></div>
            <div class="faculty-modal-body" id="studentModalBody"></div>
            <div class="faculty-modal-footer" id="studentModalFooter"></div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#studentModalClose").addEventListener("click", () => modal.classList.add("hidden"));

    forgotBtn.addEventListener("click", openForgotModal);

    function openForgotModal() {
        const header = modal.querySelector("#studentModalHeader");
        const body = modal.querySelector("#studentModalBody");
        const footer = modal.querySelector("#studentModalFooter");

        header.textContent = "Student Password Reset";
        body.innerHTML = `<p>Enter your registered Roll Number:</p>
                          <input type="text" id="studentRollInput" placeholder="Roll Number" />`;
        footer.innerHTML = `<button class="faculty-btn" id="sendStudentOtpBtn">Send OTP</button>`;
        modal.classList.remove("hidden");

        modal.querySelector("#sendStudentOtpBtn").addEventListener("click", () => {
            const roll = modal.querySelector("#studentRollInput").value.trim();
            if (!roll) return alert("Enter roll number.");

            openOtpModal(roll);

            fetch(`/password/student/send-otp?roll=${encodeURIComponent(roll)}`, { method: "POST" })
                .catch(() => alert("Failed to send OTP."));
        });
    }

    function openOtpModal(roll) {
        const header = modal.querySelector("#studentModalHeader");
        const body = modal.querySelector("#studentModalBody");
        const footer = modal.querySelector("#studentModalFooter");

        header.textContent = "Enter OTP & New Password";
        body.innerHTML = `
            <p>OTP sent to your registered email.</p>
            <input type="text" id="studentOtpInput" placeholder="OTP" />
            <div class="password-wrapper">
                <input type="password" id="studentNewPassword" placeholder="New Password" />
                <span class="toggle-eye" id="toggleStudentPassword">👁</span>
            </div>
        `;
        footer.innerHTML = `<button class="faculty-btn" id="resetStudentPasswordBtn">Reset Password</button>`;

        const pwdInput = modal.querySelector("#studentNewPassword");
        modal.querySelector("#toggleStudentPassword").addEventListener("click", () => {
            pwdInput.type = pwdInput.type === "password" ? "text" : "password";
        });

        modal.querySelector("#resetStudentPasswordBtn").addEventListener("click", async () => {
            const otp = modal.querySelector("#studentOtpInput").value.trim();
            const newPassword = pwdInput.value.trim();
            if (!otp || !newPassword) return alert("Enter OTP and new password.");

            try {
                const res = await fetch(`/password/student/reset?roll=${encodeURIComponent(roll)}&otp=${otp}&newPassword=${newPassword}`, { method: "POST" });
                if (!res.ok) throw new Error(await res.text());

                header.textContent = "✅ Password Reset Successful";
                body.innerHTML = "<p>Your password has been updated. You can now login.</p>";
                footer.innerHTML = `<button class="faculty-btn" id="studentOkBtn">OK</button>`;
                modal.querySelector("#studentOkBtn").addEventListener("click", () => modal.classList.add("hidden"));
            } catch (err) {
                alert("Error: " + err.message);
            }
        });
    }
})();
