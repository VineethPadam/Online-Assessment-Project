package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.SuperAdminProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SuperAdminProfileRepository extends JpaRepository<SuperAdminProfile, Long> {
}
