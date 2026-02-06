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
    public ResponseEntity<?> validateAdmin(@RequestBody Map<String, Object> payload) {
        String username = (payload.get("username") != null) ? payload.get("username").toString().trim() : "";
        String password = (payload.get("password") != null) ? payload.get("password").toString().trim() : "";
        Object cidObj = payload.get("collegeId");
        if (cidObj == null)
            return ResponseEntity.badRequest().body("College selection is required");
        Long collegeId = Long.valueOf(cidObj.toString());

        try {
            Admin a = adminService.validateAdmin(username, password, collegeId);

            if (a != null) {
                String token = jwtUtil.generateToken(a.getUsername(), "ADMIN", collegeId);
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("username", a.getUsername());
                response.put("role", "ADMIN");

                // Add permissions
                com.example.OnlineAssessment.entity.College c = a.getCollege();
                if (c != null) {
                    Map<String, Object> perms = new HashMap<>();
                    perms.put("allowMcq", c.isAllowMcqQuestions());
                    perms.put("allowCoding", c.isAllowCodingQuestions());
                    perms.put("allowNumeric", c.isAllowNumericQuestions());
                    perms.put("allowImages", c.isAllowImageInQuestions());
                    perms.put("allowQuestionBank", c.isAllowQuestionBankAccess());
                    perms.put("maxFaculty", c.getMaxFacultyUsers());
                    perms.put("maxStudents", c.getMaxStudentUsers());
                    response.put("permissions", perms);
                }
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid Credentials");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

}
