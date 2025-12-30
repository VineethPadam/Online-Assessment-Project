package com.example.OnlineAssessment.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.EmailOtp;
import java.util.Optional;

public interface EmailOtpRepo extends JpaRepository<EmailOtp, Long> {
    Optional<EmailOtp> findTopByEmailAndOtpAndUsedFalseOrderByExpiryTimeDesc(
            String email, String otp);
}
