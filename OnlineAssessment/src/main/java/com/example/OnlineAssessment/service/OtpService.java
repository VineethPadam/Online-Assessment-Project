package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.EmailOtp;
import com.example.OnlineAssessment.repositories.EmailOtpRepo;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    private final EmailOtpRepo otpRepo;
    private final EmailService emailService;

    public OtpService(EmailOtpRepo otpRepo, EmailService emailService) {
        this.otpRepo = otpRepo;
        this.emailService = emailService;
    }

    // Generate OTP and send email
    public void generateAndSendOtp(String email) {
        String otp = String.valueOf(100000 + new Random().nextInt(900000));

        EmailOtp entity = new EmailOtp();
        entity.setEmail(email);
        entity.setOtp(otp);
        entity.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        entity.setUsed(false);

        otpRepo.save(entity);
        emailService.sendOtpEmail(email, otp);
    }

    // Verify OTP
    public boolean verifyOtp(String email, String otp) {
        EmailOtp entity = otpRepo
                .findTopByEmailAndOtpAndUsedFalseOrderByExpiryTimeDesc(email, otp)
                .orElse(null);

        if (entity == null) return false;
        if (entity.getExpiryTime().isBefore(LocalDateTime.now())) return false;

        entity.setUsed(true);
        otpRepo.save(entity);
        return true;
    }
}
