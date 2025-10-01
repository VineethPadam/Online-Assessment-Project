package com.example.OnlineAssessment.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Admin;
import com.example.OnlineAssessment.service.AdminService;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @PostMapping("/validate")
    public ResponseEntity<?> validateAdmin(@RequestBody Admin admin){
        Admin a = adminService.validateAdmin(admin.getUsername(), admin.getPassword());

        if(a != null){
            return ResponseEntity.ok(a);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid Credentials");
        }
    }
}
