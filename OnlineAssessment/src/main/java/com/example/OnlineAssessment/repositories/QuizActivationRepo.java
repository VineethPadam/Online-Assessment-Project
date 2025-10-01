package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.QuizActivation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface QuizActivationRepo extends JpaRepository<QuizActivation, Integer> {

    // Case-insensitive fetch for active quizzes
    @Query("SELECT q FROM QuizActivation q " +
           "WHERE UPPER(q.section) = UPPER(:section) " +
           "AND UPPER(q.department) = UPPER(:department) " +
           "AND q.year = :year " +
           "AND q.active = true")
    List<QuizActivation> findActiveQuizzesIgnoreCase(
           @Param("section") String section,
           @Param("department") String department,
           @Param("year") int year);

    // Case-insensitive check if a specific quiz is active for a student
    @Query("SELECT q FROM QuizActivation q " +
           "WHERE UPPER(q.quiz.quizId) = UPPER(:quizId) " +
           "AND UPPER(q.section) = UPPER(:section) " +
           "AND UPPER(q.department) = UPPER(:department) " +
           "AND q.year = :year")
    QuizActivation findByQuizIdSectionDeptYearIgnoreCase(
           @Param("quizId") String quizId,
           @Param("section") String section,
           @Param("department") String department,
           @Param("year") int year);
}
