package com.example.OnlineAssessment.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.service.StudentService;

@RestController
@RequestMapping("/student")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentService studentService;

    // Student login
    @PostMapping("/validate")
    public ResponseEntity<?> validateStudent(@RequestBody Student student){
        Student s = studentService.validateStudent(
                student.getStudentRollNumber(),
                student.getPassword()
        );

        if(s != null){
            return ResponseEntity.ok(s);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid Credentials");
        }
    }
    
    
}
