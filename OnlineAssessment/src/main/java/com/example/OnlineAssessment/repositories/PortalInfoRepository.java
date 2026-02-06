package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.PortalInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PortalInfoRepository extends JpaRepository<PortalInfo, Long> {
}
