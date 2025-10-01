package com.example.OnlineAssessment.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.OnlineAssessment.entity.Result;

public interface ResultRepo extends JpaRepository<Result, Integer> {

    @Query("SELECT r FROM Result r " +
           "JOIN FETCH r.student s " +
           "JOIN FETCH r.quiz q " +
           "WHERE s.studentSection = :section " +
           "AND s.department = :department " +
           "AND s.studentYear = :year " +
           "AND q.quizId = :quizId")
    List<Result> findResultsBySectionDepartmentYearAndQuiz(
        @Param("section") String section,
        @Param("department") String department,
        @Param("year") String year,
        @Param("quizId") String quizId
    );

    @Query("SELECT r FROM Result r " +
           "JOIN FETCH r.student s " +
           "JOIN FETCH r.quiz q " +
           "WHERE s.studentRollNumber = :rollNumber " +
           "AND q.quizId = :quizId")
    List<Result> findResultsByStudentAndQuiz(
        @Param("rollNumber") String rollNumber,
        @Param("quizId") String quizId
    );

    // New query to fetch a single Result including answers
    @Query("SELECT r FROM Result r " +
           "JOIN r.student s " +
           "JOIN r.quiz q " +
           "WHERE s.studentRollNumber = :rollNumber " +
           "AND q.quizId = :quizId")
    Result findResultByStudentAndQuiz(
        @Param("rollNumber") String rollNumber,
        @Param("quizId") String quizId
    );

    boolean existsByStudent_StudentRollNumberAndQuiz_QuizId(
        String studentRollNumber,
        String quizId
    );
}
