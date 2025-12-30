(() => {
    const forgotBtn = document.getElementById("facultyForgotPasswordBtn");
    if (!forgotBtn) return;

    let modal = document.createElement("div");
    modal.id = "facultyModal";
    modal.className = "faculty-modal hidden";
    modal.innerHTML = `
        <div class="faculty-modal-content">
            <span class="close" id="facultyModalClose">&times;</span>
            <div class="faculty-modal-header" id="facultyModalHeader"></div>
            <div class="faculty-modal-body" id="facultyModalBody"></div>
            <div class="faculty-modal-footer" id="facultyModalFooter"></div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#facultyModalClose").addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    forgotBtn.addEventListener("click", openForgotModal);

    function openForgotModal() {
        const header = modal.querySelector("#facultyModalHeader");
        const body = modal.querySelector("#facultyModalBody");
        const footer = modal.querySelector("#facultyModalFooter");

        header.textContent = "Faculty Password Reset";
        body.innerHTML = `<p>Enter your registered email:</p>
                          <input type="email" id="facultyEmail" placeholder="Email" />`;
        footer.innerHTML = `<button class="faculty-btn" id="sendOtpBtn">Send OTP</button>`;
        modal.classList.remove("hidden");

        modal.querySelector("#sendOtpBtn").addEventListener("click", async () => {
            const email = modal.querySelector("#facultyEmail").value.trim();
            if (!email) return alert("Enter email.");

            // Open OTP modal immediately
            openOtpModal(email);

            try {
                await fetch(`/password/faculty/send-otp?email=${encodeURIComponent(email)}`, { method: "POST" });
            } catch (err) {
                alert("Failed to send OTP: " + err.message);
            }
        });
    }

    function openOtpModal(email) {
        const header = modal.querySelector("#facultyModalHeader");
        const body = modal.querySelector("#facultyModalBody");
        const footer = modal.querySelector("#facultyModalFooter");

        header.textContent = "Enter OTP & New Password";
        body.innerHTML = `
            <p>OTP sent to your email:</p>
            <input type="text" id="otpInput" placeholder="OTP" />
            <div class="password-wrapper">
                <input type="password" id="newPassword" placeholder="New Password" />
                <span class="toggle-eye" id="togglePassword">👁</span>
            </div>
        `;
        footer.innerHTML = `<button class="faculty-btn" id="resetPasswordBtn">Reset Password</button>`;

        const pwdInput = modal.querySelector("#newPassword");
        modal.querySelector("#togglePassword").addEventListener("click", () => {
            pwdInput.type = pwdInput.type === "password" ? "text" : "password";
        });

        modal.querySelector("#resetPasswordBtn").addEventListener("click", async () => {
            const otp = modal.querySelector("#otpInput").value.trim();
            const newPassword = pwdInput.value.trim();
            if (!otp || !newPassword) return alert("Enter OTP and new password.");

            try {
                const res = await fetch(`/password/faculty/reset?email=${encodeURIComponent(email)}&otp=${otp}&newPassword=${newPassword}`, { method: "POST" });
                if (!res.ok) throw new Error(await res.text());

                header.textContent = "✅ Password Reset Successful";
                body.innerHTML = "<p>Your password has been updated. You can now login.</p>";
                footer.innerHTML = `<button class="faculty-btn" id="okBtn">OK</button>`;
                modal.querySelector("#okBtn").addEventListener("click", () => modal.classList.add("hidden"));
            } catch (err) {
                alert("Error: " + err.message);
            }
        });
    }
})();
