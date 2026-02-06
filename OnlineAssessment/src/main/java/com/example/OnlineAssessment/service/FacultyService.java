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

    // College-scoped login validation
    public Faculty validateFaculty(String email, String password, Long collegeId) {
        Faculty faculty = facultyRepo.findByEmailAndCollegeId(email, collegeId).orElse(null);
        if (faculty != null && faculty.getPassword().equals(password)) {
            if (faculty.getCollege() != null && !faculty.getCollege().isActive()) {
                throw new RuntimeException("Your account has been deactivated. Please contact the Administrator.");
            }
            return faculty;
        }
        return null;
    }

    public Faculty getFacultyById(String facultyId) {
        if (facultyId == null)
            throw new IllegalArgumentException("Faculty ID cannot be null");
        return facultyRepo.findById(facultyId).orElse(null);
    }

    public Faculty saveFaculty(Faculty faculty) {
        if (faculty == null)
            throw new IllegalArgumentException("Faculty cannot be null");
        return facultyRepo.save(faculty);
    }

    public List<Faculty> getAllFaculty() {
        return facultyRepo.findAll();
    }

    public List<Faculty> getFilteredFaculty(String department, String facultyId, Long collegeId) {
        if (facultyId != null && !facultyId.trim().isEmpty()) {
            return facultyRepo.findById(facultyId)
                    .filter(f -> f.getCollege() != null && f.getCollege().getId().equals(collegeId))
                    .map(List::of)
                    .orElse(List.of());
        }
        if (department != null && !department.trim().isEmpty()) {
            return facultyRepo.findByDepartmentAndCollegeId(department, collegeId);
        }
        return facultyRepo.findByCollegeId(collegeId);
    }

    public void deleteFaculty(String facultyId, Long collegeId) {
        if (facultyId != null) {
            Faculty faculty = facultyRepo.findById(facultyId)
                    .filter(f -> f.getCollege() != null && f.getCollege().getId().equals(collegeId))
                    .orElseThrow(() -> new RuntimeException("Faculty not found in this college"));
            facultyRepo.delete(faculty);
        }
    }

    public Faculty updateFaculty(String facultyId, Faculty facultyDetails, Long collegeId) {
        Faculty faculty = facultyRepo.findById(facultyId)
                .filter(f -> f.getCollege() != null && f.getCollege().getId().equals(collegeId))
                .orElseThrow(() -> new RuntimeException("Faculty not found in this college"));

        faculty.setFacultyName(facultyDetails.getFacultyName());
        faculty.setEmail(facultyDetails.getEmail());
        faculty.setDepartment(facultyDetails.getDepartment());
        if (facultyDetails.getPassword() != null && !facultyDetails.getPassword().trim().isEmpty()) {
            faculty.setPassword(facultyDetails.getPassword());
        }
        return facultyRepo.save(faculty);
    }
}
