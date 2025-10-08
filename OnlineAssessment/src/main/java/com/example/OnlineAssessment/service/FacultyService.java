package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.repositories.FacultyRepo;
import java.util.List;

@Service
public class FacultyService {

    @Autowired
    private FacultyRepo facultyRepo;

    // Case-sensitive login validation
    public Faculty validateFaculty(String email, String password){
        List<Faculty> allFaculty = facultyRepo.findAll();
        for(Faculty f : allFaculty){
            if(f.getEmail().equals(email) && f.getPassword().equals(password)){
                return f; // exact match
            }
        }
        return null;
    }

    public Faculty getFacultyById(String facultyId) {
        return facultyRepo.findById(facultyId).orElse(null);
    }

    public Faculty saveFaculty(Faculty faculty) {
        return facultyRepo.save(faculty);
    }
}
