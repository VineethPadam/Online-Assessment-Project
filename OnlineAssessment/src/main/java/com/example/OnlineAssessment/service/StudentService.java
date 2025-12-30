package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.repositories.studentRepo;

@Service
public class StudentService {

    @Autowired
    private studentRepo studentRepo;

    // Case-sensitive login validation
    public Student validateStudent(String rollNumber, String password){
        Student student = studentRepo.findById(rollNumber).orElse(null);
        if(student != null && student.getPassword().equals(password)){
            return student; // exact match
        }
        return null;
    }

    public Student saveStudent(Student student) {
        return studentRepo.save(student);
    }
    
    public Student getByRollNumber(String rollNumber) {
        return studentRepo.findById(rollNumber)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
    }

}
