package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.repositories.studentRepo;

@Service
public class StudentService {

    @Autowired
    private studentRepo studentRepo;

    public Student validateStudent(String rollNumber, String email, String department, int year){
        return studentRepo.findByStudentRollNumberAndStudentEmailAndDepartmentAndStudentYear(
                    rollNumber, email, department, year
               )
               .orElse(null);
    }
}
