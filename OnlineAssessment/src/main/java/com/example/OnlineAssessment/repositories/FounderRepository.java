package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.Founder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FounderRepository extends JpaRepository<Founder, Long> {
}
