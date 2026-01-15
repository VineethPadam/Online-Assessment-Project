package com.example.OnlineAssessment.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Admin;
import com.example.OnlineAssessment.security.JwtUtil;
import com.example.OnlineAssessment.service.AdminService;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/validate")
    public ResponseEntity<?> validateAdmin(@RequestBody Admin admin) {

        String username = admin.getUsername().trim();
        String password = admin.getPassword().trim();

        Admin a = adminService.validateAdmin(username, password);

        if (a != null) {
            String token = jwtUtil.generateToken(a.getUsername(), "ADMIN");
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("username", a.getUsername());
            response.put("role", "ADMIN");
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Credentials");
    }

}
