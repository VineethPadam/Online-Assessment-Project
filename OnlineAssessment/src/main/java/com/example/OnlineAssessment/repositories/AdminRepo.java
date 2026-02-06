package com.example.OnlineAssessment.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.OnlineAssessment.entity.Admin;

public interface AdminRepo extends JpaRepository<Admin, String> {

    java.util.Optional<Admin> findByUsernameAndCollege_Id(String username, Long id);

    boolean existsByPassword(String password);
}
