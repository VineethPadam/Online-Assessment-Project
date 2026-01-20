package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.entity.Department;
import com.example.OnlineAssessment.service.DepartmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departments")
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    // Get all departments
    @GetMapping
    public List<Department> getDepartments() {
        return departmentService.getAllDepartments();
    }

    // Add a department
    @PostMapping("/add")
    public Department addDepartment(@RequestParam String name) {
        return departmentService.addDepartment(name);
    }

    // Delete a department
    @DeleteMapping("/delete/{id}")
    public void deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
    }
}
