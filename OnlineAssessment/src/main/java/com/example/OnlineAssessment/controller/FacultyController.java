package com.example.OnlineAssessment.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.security.JwtUtil;
import com.example.OnlineAssessment.service.FacultyService;

@RestController
@RequestMapping("/faculty")
@CrossOrigin(origins = "*")
public class FacultyController {

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/validate")
    public ResponseEntity<?> validateFaculty(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        String password = (String) payload.get("password");
        Object cidObj = payload.get("collegeId");
        if (cidObj == null)
            return ResponseEntity.badRequest().body("College selection is required");
        Long collegeId = Long.valueOf(cidObj.toString());

        try {
            Faculty f = facultyService.validateFaculty(email, password, collegeId);

            if (f != null) {

                String token = jwtUtil.generateToken(f.getEmail(), "FACULTY", collegeId);

                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("email", f.getEmail());
                response.put("facultyName", f.getFacultyName());
                response.put("department", f.getDepartment());
                response.put("facultyId", f.getFacultyId());
                response.put("role", "FACULTY");

                // Add permissions
                com.example.OnlineAssessment.entity.College c = f.getCollege();
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

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Invalid Credentials");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }
}
