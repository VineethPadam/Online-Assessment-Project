package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.entity.Department;
import com.example.OnlineAssessment.service.DepartmentService;
import com.example.OnlineAssessment.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departments")
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentService departmentService;

    @Autowired
    private JwtUtil jwtUtil;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    private Long getCollegeId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractCollegeId(authHeader.substring(7));
        }
        return null;
    }

    // Get all departments (college scoped)
    @GetMapping
    public List<Department> getDepartments(@RequestHeader("Authorization") String authHeader) {
        Long collegeId = getCollegeId(authHeader);
        return departmentService.getDepartmentsByCollege(collegeId);
    }

    // Add a department
    @PostMapping("/add")
    public Department addDepartment(@RequestHeader("Authorization") String authHeader,
            @RequestParam String name, @RequestParam int years, @RequestParam String sections) {
        Long collegeId = getCollegeId(authHeader);
        return departmentService.addDepartment(name, years, sections, collegeId);
    }

    // Update a department
    @PutMapping("/update/{id}")
    public Department updateDepartment(@PathVariable Long id, @RequestParam String name, @RequestParam int years,
            @RequestParam String sections) {
        return departmentService.updateDepartment(id, name, years, sections);
    }

    // Delete a department
    @DeleteMapping("/delete/{id}")
    public void deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
    }
}
