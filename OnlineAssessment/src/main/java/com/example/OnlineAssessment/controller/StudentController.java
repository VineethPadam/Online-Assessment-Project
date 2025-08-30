package com.example.OnlineAssessment.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.service.StudentService;

@RestController
@RequestMapping("/student")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @PostMapping("/validate")
    public String validateStudent(@RequestBody Student student) {
        boolean isValid = studentService.validateStudent(
            student.getStudentRollNumber(),
            student.getStudentEmail(),
            student.getDepartment()
        );
        return isValid ? "Login Successful" : "Invalid Credentials";
    }
}
