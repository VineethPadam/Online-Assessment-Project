package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Admin;
import com.example.OnlineAssessment.repositories.AdminRepo;

@Service
public class AdminService {

    @Autowired
    private AdminRepo adminRepo;

    public Admin validateAdmin(String username, String password, Long collegeId) {
        Admin admin = adminRepo.findByUsernameAndCollege_Id(username, collegeId).orElse(null);
        if (admin != null && admin.getPassword().equals(password)) {
            // Check if the college is active
            if (admin.getCollege() != null && !admin.getCollege().isActive()) {
                throw new RuntimeException("Your account has been deactivated. Please contact the Administrator.");
            }
            return admin;
        }
        return null;
    }
}
