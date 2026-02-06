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
                        "AND q.id = :quizId " +
                        "AND s.college.id = :collegeId")
        List<Result> findResultsBySectionDepartmentYearAndQuiz(
                        @Param("section") String section,
                        @Param("department") String department,
                        @Param("year") int year,
                        @Param("quizId") Long quizId,
                        @Param("collegeId") Long collegeId);

        @Query("SELECT r FROM Result r " +
                        "JOIN FETCH r.student s " +
                        "JOIN FETCH r.quiz q " +
                        "WHERE s.studentRollNumber = :rollNumber " +
                        "AND q.id = :quizId " +
                        "AND s.college.id = :collegeId")
        List<Result> findResultsByStudentAndQuiz(
                        @Param("rollNumber") String rollNumber,
                        @Param("quizId") Long quizId,
                        @Param("collegeId") Long collegeId);

        // New query to fetch a single Result including answers
        @Query("SELECT r FROM Result r " +
                        "JOIN r.student s " +
                        "JOIN r.quiz q " +
                        "WHERE s.studentRollNumber = :rollNumber " +
                        "AND q.id = :quizId " +
                        "AND s.college.id = :collegeId")
        Result findResultByStudentAndQuiz(
                        @Param("rollNumber") String rollNumber,
                        @Param("quizId") Long quizId,
                        @Param("collegeId") Long collegeId);

        boolean existsByStudent_StudentRollNumberAndQuiz_IdAndStudent_College_Id(
                        String studentRollNumber,
                        Long quizId,
                        Long collegeId);

        @Query("""
                            SELECT r FROM Result r
                            JOIN FETCH r.student s
                            JOIN FETCH r.quiz q
                            WHERE q.id = :quizId
                            AND s.college.id = :collegeId
                            ORDER BY r.score DESC, r.submissionTime ASC
                        """)
        List<Result> findRankedByQuiz(@Param("quizId") Long quizId, @Param("collegeId") Long collegeId);

        @Query("""
                            SELECT r FROM Result r
                            JOIN FETCH r.student s
                            JOIN FETCH r.quiz q
                            WHERE q.id = :quizId
                            AND s.department = :department
                            AND s.college.id = :collegeId
                            ORDER BY r.score DESC, r.submissionTime ASC
                        """)
        List<Result> findRankedByQuizAndDepartment(
                        @Param("quizId") Long quizId,
                        @Param("department") String department,
                        @Param("collegeId") Long collegeId);

        @Query("""
                            SELECT r FROM Result r
                            JOIN FETCH r.student s
                            JOIN FETCH r.quiz q
                            WHERE q.id = :quizId
                            AND s.department = :department
                            AND s.studentSection = :section
                            AND s.studentYear = :year
                            AND s.college.id = :collegeId
                            ORDER BY r.score DESC, r.submissionTime ASC
                        """)
        List<Result> findRankedByQuizDepartmentSectionYear(
                        @Param("quizId") Long quizId,
                        @Param("department") String department,
                        @Param("section") String section,
                        @Param("year") int year,
                        @Param("collegeId") Long collegeId);

        @Query("""
                            SELECT r FROM Result r
                            JOIN FETCH r.student s
                            JOIN FETCH r.quiz q
                            WHERE q.id = :quizId
                            AND s.department = :department
                            AND s.studentSection = :section
                            AND s.college.id = :collegeId
                            ORDER BY r.score DESC, r.submissionTime ASC
                        """)
        List<Result> findRankedByQuizDepartmentSection(
                        @Param("quizId") Long quizId,
                        @Param("department") String department,
                        @Param("section") String section,
                        @Param("collegeId") Long collegeId);

        @Query("""
                            SELECT r FROM Result r
                            JOIN FETCH r.student s
                            JOIN FETCH r.quiz q
                            WHERE q.id = :quizId
                            AND s.department = :department
                            AND s.studentYear = :year
                            AND s.college.id = :collegeId
                            ORDER BY r.score DESC, r.submissionTime ASC
                        """)
        List<Result> findRankedByQuizDepartmentYear(
                        @Param("quizId") Long quizId,
                        @Param("department") String department,
                        @Param("year") int year,
                        @Param("collegeId") Long collegeId);

        @Query("SELECT r FROM Result r JOIN FETCH r.student s JOIN FETCH r.quiz q WHERE s.studentRollNumber = :rollNumber AND s.college.id = :collegeId")
        List<Result> findResultsByStudent_StudentRollNumber(@Param("rollNumber") String rollNumber,
                        @Param("collegeId") Long collegeId);

}
