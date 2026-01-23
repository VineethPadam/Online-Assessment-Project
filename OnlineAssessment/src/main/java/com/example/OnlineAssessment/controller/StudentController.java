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
    public ResponseEntity<?> validateStudent(@RequestBody Student student) {

        Student s = studentService.validateStudent(
                student.getStudentRollNumber(),
                student.getPassword()
        );

        if (s != null) {

            String token = jwtUtil.generateToken(
                    s.getStudentRollNumber(),
                    "STUDENT"
            );

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("rollNumber", s.getStudentRollNumber());
            response.put("name", s.getStudentName());
            response.put("department", s.getDepartment());
            response.put("section", s.getStudentSection());
            response.put("role", "STUDENT");

            return ResponseEntity.ok(response);
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)  // ✅ 400 instead of 401
                .body("Invalid student roll number or password");

    }
}
