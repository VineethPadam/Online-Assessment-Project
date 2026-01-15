package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    // Simple test login for any role
    @PostMapping("/login")
    public Map<String, String> login(@RequestParam String username, @RequestParam String role) {
        String token = jwtUtil.generateToken(username, role);
        Map<String, String> map = new HashMap<>();
        map.put("token", token);
        return map;
    }
}
