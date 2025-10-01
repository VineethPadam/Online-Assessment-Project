package com.example.OnlineAssessment.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.OnlineAssessment.entity.Admin;

public interface AdminRepo extends JpaRepository<Admin, String> {
    Optional<Admin> findByUsernameAndPassword(String username, String password);
    
}
