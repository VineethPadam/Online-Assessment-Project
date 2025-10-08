package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Admin;
import com.example.OnlineAssessment.repositories.AdminRepo;

@Service
public class AdminService {

    @Autowired
    private AdminRepo adminRepo;

    public Admin validateAdmin(String username, String password){
        Admin admin = adminRepo.findById(username).orElse(null);
        if(admin != null && admin.getPassword().equals(password)) {
            return admin; // case-sensitive check
        }
        return null;
    }
}
