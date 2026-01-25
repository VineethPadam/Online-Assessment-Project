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
                        "AND q.id = :quizId")
        List<Result> findResultsBySectionDepartmentYearAndQuiz(
                        @Param("section") String section,
                        @Param("department") String department,
                        @Param("year") int year,
                        @Param("quizId") Long quizId);

        @Query("SELECT r FROM Result r " +
                        "JOIN FETCH r.student s " +
                        "JOIN FETCH r.quiz q " +
                        "WHERE s.studentRollNumber = :rollNumber " +
                        "AND q.id = :quizId")
        List<Result> findResultsByStudentAndQuiz(
                        @Param("rollNumber") String rollNumber,
                        @Param("quizId") Long quizId);

        // New query to fetch a single Result including answers
        @Query("SELECT r FROM Result r " +
                        "JOIN r.student s " +
                        "JOIN r.quiz q " +
                        "WHERE s.studentRollNumber = :rollNumber " +
                        "AND q.id = :quizId")
        Result findResultByStudentAndQuiz(
                        @Param("rollNumber") String rollNumber,
                        @Param("quizId") Long quizId);

        boolean existsByStudent_StudentRollNumberAndQuiz_Id(
                        String studentRollNumber,
                        Long quizId);

        @Query("""
                            SELECT r FROM Result r
                            JOIN FETCH r.student s
                            JOIN FETCH r.quiz q
                            WHERE q.id = :quizId
                            ORDER BY r.score DESC, r.submissionTime ASC
                        """)
        List<Result> findRankedByQuiz(@Param("quizId") Long quizId);

        @Query("""
                            SELECT r FROM Result r
                            JOIN FETCH r.student s
                            JOIN FETCH r.quiz q
                            WHERE q.id = :quizId
                            AND s.department = :department
                            ORDER BY r.score DESC, r.submissionTime ASC
                        """)
        List<Result> findRankedByQuizAndDepartment(
                        @Param("quizId") Long quizId,
                        @Param("department") String department);

        @Query("""
                            SELECT r FROM Result r
                            JOIN FETCH r.student s
                            JOIN FETCH r.quiz q
                            WHERE q.id = :quizId
                            AND s.department = :department
                            AND s.studentSection = :section
                            AND s.studentYear = :year
                            ORDER BY r.score DESC, r.submissionTime ASC
                        """)
        List<Result> findRankedByQuizDepartmentSectionYear(
                        @Param("quizId") Long quizId,
                        @Param("department") String department,
                        @Param("section") String section,
                        @Param("year") int year);

        @Query("""
                            SELECT r FROM Result r
                            JOIN FETCH r.student s
                            JOIN FETCH r.quiz q
                            WHERE q.id = :quizId
                            AND s.department = :department
                            AND s.studentSection = :section
                            ORDER BY r.score DESC, r.submissionTime ASC
                        """)
        List<Result> findRankedByQuizDepartmentSection(
                        @Param("quizId") Long quizId,
                        @Param("department") String department,
                        @Param("section") String section);

        @Query("""
                            SELECT r FROM Result r
                            JOIN FETCH r.student s
                            JOIN FETCH r.quiz q
                            WHERE q.id = :quizId
                            AND s.department = :department
                            AND s.studentYear = :year
                            ORDER BY r.score DESC, r.submissionTime ASC
                        """)
        List<Result> findRankedByQuizDepartmentYear(
                        @Param("quizId") Long quizId,
                        @Param("department") String department,
                        @Param("year") int year);

        @Query("SELECT r FROM Result r JOIN FETCH r.student s JOIN FETCH r.quiz q WHERE s.studentRollNumber = :rollNumber")
        List<Result> findResultsByStudent_StudentRollNumber(@Param("rollNumber") String rollNumber);

}
