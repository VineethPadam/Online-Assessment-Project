package com.example.OnlineAssessment.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.Department;

public interface DepartmentRepo extends JpaRepository<Department, Long> {
    boolean existsByNameAndCollege_Id(String name, Long collegeId);

    java.util.List<Department> findByCollege_Id(Long collegeId);
}
