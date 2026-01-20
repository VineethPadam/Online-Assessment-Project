package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.Department;
import com.example.OnlineAssessment.repositories.DepartmentRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepo departmentRepo;

    public DepartmentService(DepartmentRepo departmentRepo) {
        this.departmentRepo = departmentRepo;
    }

    public List<Department> getAllDepartments() {
        return departmentRepo.findAll();
    }

    public Department addDepartment(String name) {
        if (departmentRepo.existsByName(name)) {
            throw new RuntimeException("Department already exists");
        }
        Department dept = new Department(name);
        return departmentRepo.save(dept);
    }

    public void deleteDepartment(Long id) {
        departmentRepo.deleteById(id);
    }
}
