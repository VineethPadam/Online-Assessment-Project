(() => {
    // ------------------ ABOUT & CONTACT MODALS ------------------
    function createInfoModal(id, title, content) {
        if (document.getElementById(id)) return; // exists
        const modal = document.createElement("div");
        modal.id = id;
        modal.className = "faculty-modal hidden"; // reusing style
        modal.innerHTML = `
            <div class="faculty-modal-content">
                <span class="close" onclick="document.getElementById('${id}').classList.add('hidden')">&times;</span>
                <div class="faculty-modal-header">${title}</div>
                <div class="about-content">${content}</div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Attach to Navbar Links
    document.getElementById("aboutUsBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        createInfoModal("aboutModal", "About Us",
            `<p>Welcome to <strong>AssessPRO</strong>, the premier online assessment platform for MITS.</p>
             <p>Our goal is to streamline the examination process, making it efficient, secure, and accessible for everyone.</p>
             <p>Developed with ❤️ by the CSE Batch of 2027.</p>`);
        document.getElementById("aboutModal").classList.remove("hidden");
    });

    document.getElementById("contactUsBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        createInfoModal("contactModal", "Contact Us",
            `<p>Have questions or need support?</p>
             <p>Email us directly at:</p>
             <a href="mailto:vineeth.padam@gmail.com" class="contact-btn">vineeth.padam@gmail.com</a>
             <p style="margin-top:20px; font-size:0.85rem; color:#888;">We typically respond within 24 hours.</p>`);
        document.getElementById("contactModal").classList.remove("hidden");
    });


    // ------------------ FORGOT PASSWORD LOGIC ------------------
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
            if (!roll) return showAlert("Enter roll number.");

            // Simulate / Call API
            fetch(`/password/student/send-otp?roll=${encodeURIComponent(roll)}`, { method: "POST" })
                .then(async res => {
                    if (res.ok) {
                        openOtpModal(roll);
                    } else {
                        showAlert(await res.text());
                    }
                })
                .catch(() => showAlert("Failed to send OTP."));
        });
    }

    function openOtpModal(roll) {
        const header = modal.querySelector("#studentModalHeader");
        const body = modal.querySelector("#studentModalBody");
        const footer = modal.querySelector("#studentModalFooter");

        header.textContent = "Set New Password";
        body.innerHTML = `
            <p>OTP sent to your email.</p>
            <input type="text" id="studentOtpInput" placeholder="Enter OTP" />
            
            <div class="password-wrapper">
                <input type="password" id="studentNewPassword" placeholder="New Password" />
                <span class="toggle-eye" id="toggleStudentPassword">👁</span>
            </div>
            <span id="pwdError" class="error-text"></span>

            <div class="password-wrapper">
                <input type="password" id="studentConfirmPassword" placeholder="Confirm Password" />
            </div>
            <span id="matchError" class="error-text"></span>
        `;
        footer.innerHTML = `<button class="faculty-btn" id="resetStudentPasswordBtn">Reset Password</button>`;

        const pwdInput = modal.querySelector("#studentNewPassword");
        const confirmInput = modal.querySelector("#studentConfirmPassword");
        const pwdError = modal.querySelector("#pwdError");
        const matchError = modal.querySelector("#matchError");

        modal.querySelector("#toggleStudentPassword").addEventListener("click", () => {
            pwdInput.type = pwdInput.type === "password" ? "text" : "password";
        });

        // Validation Regex
        // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        modal.querySelector("#resetStudentPasswordBtn").addEventListener("click", async () => {
            pwdError.textContent = "";
            matchError.textContent = "";

            const otp = modal.querySelector("#studentOtpInput").value.trim();
            const newPassword = pwdInput.value;
            const confirmPassword = confirmInput.value;

            if (!otp) return showAlert("Enter OTP.");

            // Enhanced Validation
            if (!pwdRegex.test(newPassword)) {
                pwdError.innerHTML = "Password must be >8 chars, with 1 Upper, 1 Lower, 1 Num, 1 Special.";
                return;
            }

            if (newPassword !== confirmPassword) {
                matchError.textContent = "Passwords do not match!";
                return;
            }

            try {
                const res = await fetch(`/password/student/reset?roll=${encodeURIComponent(roll)}&otp=${otp}&newPassword=${encodeURIComponent(newPassword)}`, { method: "POST" });
                if (!res.ok) throw new Error(await res.text());

                header.textContent = "✅ Success";
                body.innerHTML = "<p>Your password has been reset successfully.</p>";
                footer.innerHTML = `<button class="faculty-btn" id="studentOkBtn">Login Now</button>`;
                modal.querySelector("#studentOkBtn").addEventListener("click", () => modal.classList.add("hidden"));
            } catch (err) {
                showAlert("Error: " + err.message);
            }
        });
    }
})();
