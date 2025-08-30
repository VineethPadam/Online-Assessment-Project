package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.repositories.studentRepo;

@Service
public class StudentService {

    @Autowired
    private studentRepo studentRepo;

    public boolean validateStudent(String rollNumber, String email, String department) {
        return studentRepo.findByStudentRollNumberAndStudentEmailAndDepartment(rollNumber, email, department).isPresent();
    }
}
