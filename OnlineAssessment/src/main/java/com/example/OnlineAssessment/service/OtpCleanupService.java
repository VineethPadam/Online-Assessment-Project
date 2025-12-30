package com.example.OnlineAssessment.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.example.OnlineAssessment.repositories.EmailOtpRepo;

import java.time.LocalDateTime;

@Service
public class OtpCleanupService {

    private final EmailOtpRepo otpRepo;

    public OtpCleanupService(EmailOtpRepo otpRepo) {
        this.otpRepo = otpRepo;
    }

    // Runs every 10 minutes
    @Scheduled(fixedRate = 600000)
    public void deleteExpiredOtps() {
        otpRepo.findAll().stream()
               .filter(otp -> otp.getExpiryTime().isBefore(LocalDateTime.now()) || otp.isUsed())
               .forEach(otpRepo::delete);
    }
}
