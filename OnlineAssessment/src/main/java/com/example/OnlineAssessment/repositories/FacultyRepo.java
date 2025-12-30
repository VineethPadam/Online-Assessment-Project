package com.example.OnlineAssessment.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.Faculty;

public interface FacultyRepo extends JpaRepository<Faculty, String> {
	Faculty findByEmail(String email);
    
}
