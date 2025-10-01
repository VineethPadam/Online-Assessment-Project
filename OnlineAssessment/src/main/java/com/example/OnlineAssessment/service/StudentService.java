package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.repositories.studentRepo;

@Service
public class StudentService {

    @Autowired
    private studentRepo studentRepo;

    // Login validation
    public Student validateStudent(String rollNumber, String password){
        return studentRepo.findByStudentRollNumberAndPassword(rollNumber, password)
                          .orElse(null);
    }

    // Save student (used for Excel upload)
    public Student saveStudent(Student student) {
        return studentRepo.save(student);
    }
}
