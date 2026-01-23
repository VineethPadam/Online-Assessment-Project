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
    public ResponseEntity<?> validateFaculty(@RequestBody Faculty faculty) {

        Faculty f = facultyService.validateFaculty(
                faculty.getEmail(),
                faculty.getPassword()
        );

        if (f != null) {

            String token = jwtUtil.generateToken(f.getEmail(), "FACULTY");

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("email", f.getEmail());
            response.put("facultyName", f.getFacultyName());
            response.put("department", f.getDepartment());
            response.put("facultyId", f.getFacultyId());
            response.put("role", "FACULTY");

            return ResponseEntity.ok(response);
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body("Invalid Credentials");
    }
}
