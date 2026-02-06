package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.Department;
import com.example.OnlineAssessment.repositories.DepartmentRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepo departmentRepo;
    private final com.example.OnlineAssessment.repositories.CollegeRepo collegeRepo;

    public DepartmentService(DepartmentRepo departmentRepo,
            com.example.OnlineAssessment.repositories.CollegeRepo collegeRepo) {
        this.departmentRepo = departmentRepo;
        this.collegeRepo = collegeRepo;
    }

    public List<Department> getAllDepartments() {
        return departmentRepo.findAll();
    }

    public List<Department> getDepartmentsByCollege(Long collegeId) {
        return departmentRepo.findByCollege_Id(collegeId);
    }

    public Department addDepartment(String name, int years, String sections, Long collegeId) {
        if (departmentRepo.existsByNameAndCollege_Id(name, collegeId)) {
            throw new RuntimeException("Department already exists in this college");
        }
        Department dept = new Department(name, years, sections);
        if (collegeId != null) {
            dept.setCollege(collegeRepo.findById(collegeId).orElse(null));
        }
        return departmentRepo.save(dept);
    }

    public Department updateDepartment(Long id, String name, int years, String sections) {
        if (id == null)
            throw new IllegalArgumentException("ID cannot be null");
        Department dept = departmentRepo.findById(id).orElseThrow(() -> new RuntimeException("Department not found"));
        dept.setName(name);
        dept.setYears(years);
        dept.setSections(sections);
        return departmentRepo.save(dept);
    }

    public void deleteDepartment(Long id) {
        if (id != null) {
            departmentRepo.deleteById(id);
        }
    }
}
