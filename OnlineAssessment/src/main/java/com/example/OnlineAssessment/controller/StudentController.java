package com.example.OnlineAssessment.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.security.JwtUtil;
import com.example.OnlineAssessment.service.StudentService;

@RestController
@RequestMapping("/student")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/validate")
    public ResponseEntity<?> validateStudent(@RequestBody Map<String, Object> payload) {
        String rollNumber = (String) payload.get("studentRollNumber");
        String password = (String) payload.get("password");
        Object cidObj = payload.get("collegeId");
        if (cidObj == null)
            return ResponseEntity.badRequest().body("College selection is required");
        Long collegeId = Long.valueOf(cidObj.toString());

        try {
            Student s = studentService.validateStudent(rollNumber, password, collegeId);

            if (s != null) {

                String token = jwtUtil.generateToken(
                        s.getStudentRollNumber(),
                        "STUDENT",
                        collegeId);

                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("rollNumber", s.getStudentRollNumber());
                response.put("name", s.getStudentName());
                response.put("department", s.getDepartment());
                response.put("section", s.getStudentSection());
                response.put("year", s.getStudentYear());
                response.put("email", s.getStudentEmail());
                response.put("role", "STUDENT");

                return ResponseEntity.ok(response);
            }

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Invalid student roll number or password");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }

    }
}
