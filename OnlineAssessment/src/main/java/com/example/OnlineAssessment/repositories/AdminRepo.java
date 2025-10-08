package com.example.OnlineAssessment.repositories;



import org.springframework.data.jpa.repository.JpaRepository;

import com.example.OnlineAssessment.entity.Admin;

public interface AdminRepo extends JpaRepository<Admin, String> {
    
    
}
