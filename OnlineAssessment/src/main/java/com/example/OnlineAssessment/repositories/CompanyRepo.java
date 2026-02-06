package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepo extends JpaRepository<Company, Long> {
    Company findByName(String name);
}
