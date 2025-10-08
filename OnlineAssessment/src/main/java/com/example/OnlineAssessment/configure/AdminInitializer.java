package com.example.OnlineAssessment.configure;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.OnlineAssessment.entity.Admin;
import com.example.OnlineAssessment.repositories.AdminRepo;

@Component
public class AdminInitializer implements CommandLineRunner {

    @Autowired
    private AdminRepo adminRepo;

    @Override
    public void run(String... args) throws Exception {
        String defaultUsername = "quiz_admin_mits";
        String defaultPassword = "MITS@Quiz2025!"; // Change to a secure password

        // Check if the admin already exists
        if (!adminRepo.existsById(defaultUsername)) {
            Admin admin = new Admin();
            admin.setUsername(defaultUsername);
            admin.setPassword(defaultPassword);
            adminRepo.save(admin);
            System.out.println("Default admin created!");
        } else {
            System.out.println("Admin already exists.");
        }
    }
}
