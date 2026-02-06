package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.TrainingApproach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingApproachRepository extends JpaRepository<TrainingApproach, Long> {
}
