package com.example.OnlineAssessment.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.OnlineAssessment.entity.Questions;
import java.util.List;

public interface QuestionRepo extends JpaRepository<Questions, Integer> {

    // JPQL query (entity-based, not raw SQL)
    @Query("SELECT q FROM Questions q WHERE q.quiz.quizId = :quizId")
    List<Questions> findQuestionsByQuizId(@Param("quizId") int quizId);
}
