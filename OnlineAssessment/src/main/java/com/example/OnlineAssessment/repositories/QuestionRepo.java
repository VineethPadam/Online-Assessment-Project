package com.example.OnlineAssessment.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.OnlineAssessment.entity.Questions;

public interface QuestionRepo extends JpaRepository<Questions, Integer> {

    @Query("SELECT q FROM Questions q JOIN FETCH q.options WHERE q.quiz.quizId = :quizId")
    List<Questions> findQuestionsByQuizId(@Param("quizId") int quizId);
}
