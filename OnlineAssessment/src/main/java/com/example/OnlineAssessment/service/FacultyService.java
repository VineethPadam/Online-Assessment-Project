package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.repositories.FacultyRepo;

@Service
public class FacultyService {

    @Autowired
    private FacultyRepo facultyRepo;

    public Faculty validateFaculty(String email, String department){
        return facultyRepo.findByEmailAndDepartment(email, department)
                          .orElse(null);
    }
}
