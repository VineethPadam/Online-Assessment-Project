package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.security.JwtUtil;
import com.example.OnlineAssessment.service.SuperAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private SuperAdminService superAdminService;

    @org.springframework.beans.factory.annotation.Value("${superadmin.username}")
    private String saUser;

    @org.springframework.beans.factory.annotation.Value("${superadmin.password}")
    private String saPass;

    @GetMapping("/colleges")
    public List<com.example.OnlineAssessment.entity.College> getColleges() {
        return superAdminService.getAllColleges();
    }

    // Admin Login (Protected by logic, used by SuperAdmin UI)
    @PostMapping("/admin/login")
    public Map<String, String> adminLogin(@RequestBody Map<String, String> body) {
        String u = body.get("username");
        String p = body.get("password");

        if (saUser.equals(u) && saPass.equals(p)) {
            String token = jwtUtil.generateToken(u, "SUPERADMIN");
            Map<String, String> map = new HashMap<>();
            map.put("token", token);
            return map;
        }
        throw new RuntimeException("Invalid Admin Credentials");
    }
}
