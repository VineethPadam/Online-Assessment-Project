package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.service.FacultyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/faculty")
@CrossOrigin(origins = "*")
public class FacultyController {

    @Autowired
    private FacultyService facultyService;

    // ✅ Faculty login
    @PostMapping("/validate")
    public ResponseEntity<?> validateFaculty(@RequestBody Faculty faculty){
        Faculty f = facultyService.validateFaculty(
                faculty.getEmail(),
                faculty.getPassword()
        );

        if(f != null){
            return ResponseEntity.ok(f);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid Credentials");
        }
    }

    // ✅ Optional: View all activations (faculty can check which quizzes are active)
    // You can implement this by calling a QuizService method returning all QuizActivation entries
}
