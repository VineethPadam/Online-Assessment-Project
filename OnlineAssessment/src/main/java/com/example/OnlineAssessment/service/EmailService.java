package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("mitsonlineassessmentportal@gmail.com"); // Your email
            helper.setTo(toEmail);
            helper.setSubject("Mits Assesment portal OTP to Change Password");
            helper.setText("Hello!\n Your OTP is: " + otp + "\nValid for 10 minutes.");

            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
