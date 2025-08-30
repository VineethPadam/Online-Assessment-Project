package com.example.OnlineAssessment.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.OnlineAssessment.entity.Quiz;

public interface QuizRepo extends JpaRepository<Quiz, Integer>{

}
