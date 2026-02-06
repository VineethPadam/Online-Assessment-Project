package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.College;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollegeRepo extends JpaRepository<College, Long> {
    College findByAccessCode(String accessCode);

    boolean existsByContactEmail(String email);

    boolean existsByCollegeName(String name);

    boolean existsByAccessCode(String accessCode);
}
