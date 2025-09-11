package com.example.OnlineAssessment.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.OnlineAssessment.entity.Faculty;

public interface FacultyRepo extends JpaRepository<Faculty, String> {
    Optional<Faculty> findByEmailAndDepartment(String email, String department);
}
