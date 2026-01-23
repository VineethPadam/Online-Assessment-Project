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
                await authFetch(`/password/faculty/send-otp?email=${encodeURIComponent(email)}`, { method: "POST" });
            } catch (err) {
                alert("Failed to send OTP: " + err.message);
            }
        });
    }

    function openOtpModal(email) {
        const header = modal.querySelector("#facultyModalHeader");
        const body = modal.querySelector("#facultyModalBody");
        const footer = modal.querySelector("#facultyModalFooter");

        header.textContent = "Set New Password";
        body.innerHTML = `
            <p>OTP sent to your email:</p>
            <input type="text" id="otpInput" placeholder="Enter OTP" />
            
            <div class="password-wrapper">
                <input type="password" id="newPassword" placeholder="New Password" />
                <span class="toggle-eye" id="togglePassword">👁</span>
            </div>
            <span id="pwdError" class="error-text"></span>

            <div class="password-wrapper">
                <input type="password" id="confirmPassword" placeholder="Confirm Password" />
            </div>
            <span id="matchError" class="error-text"></span>
        `;
        footer.innerHTML = `<button class="faculty-btn" id="resetPasswordBtn">Reset Password</button>`;

        const pwdInput = modal.querySelector("#newPassword");
        const confirmInput = modal.querySelector("#confirmPassword");
        const pwdError = modal.querySelector("#pwdError");
        const matchError = modal.querySelector("#matchError");

        modal.querySelector("#togglePassword").addEventListener("click", () => {
            pwdInput.type = pwdInput.type === "password" ? "text" : "password";
        });

        const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        modal.querySelector("#resetPasswordBtn").addEventListener("click", async () => {
            pwdError.textContent = "";
            matchError.textContent = "";

            const otp = modal.querySelector("#otpInput").value.trim();
            const newPassword = pwdInput.value;
            const confirmPassword = confirmInput.value;

            if (!otp) return alert("Enter OTP.");

            if (!pwdRegex.test(newPassword)) {
                pwdError.innerHTML = "Password must be >8 chars, with 1 Upper, 1 Lower, 1 Num, 1 Special.";
                return;
            }

            if (newPassword !== confirmPassword) {
                matchError.textContent = "Passwords do not match!";
                return;
            }

            try {
                const res = await authFetch(`/password/faculty/reset?email=${encodeURIComponent(email)}&otp=${otp}&newPassword=${encodeURIComponent(newPassword)}`, { method: "POST" });
                if (!res.ok) throw new Error(await res.text());

                header.textContent = "✅ Success";
                body.innerHTML = "<p>Your password has been updated. You can now login.</p>";
                footer.innerHTML = `<button class="faculty-btn" id="okBtn">Login Now</button>`;
                modal.querySelector("#okBtn").addEventListener("click", () => modal.classList.add("hidden"));
            } catch (err) {
                alert("Error: " + err.message);
            }
        });
    }
})();
