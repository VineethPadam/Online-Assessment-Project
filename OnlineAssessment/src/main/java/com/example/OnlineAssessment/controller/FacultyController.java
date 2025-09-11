package com.example.OnlineAssessment.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.service.FacultyService;

@RestController
@RequestMapping("/faculty")
@CrossOrigin(origins = "*")
public class FacultyController {

    @Autowired
    private FacultyService facultyService;

    @PostMapping("/validate")
    public ResponseEntity<?> validateFaculty(@RequestBody Faculty faculty){
        Faculty f = facultyService.validateFaculty(
                faculty.getEmail(),
                faculty.getDepartment()
        );

        if(f != null){
            return ResponseEntity.ok(f);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid Credentials");
        }
    }
}
