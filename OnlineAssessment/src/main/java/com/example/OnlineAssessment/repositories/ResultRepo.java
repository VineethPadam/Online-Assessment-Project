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
           "WHERE s.studentSection = :section AND s.department = :department")
    List<Result> findResultsBySectionAndDepartment(
        @Param("section") String section,
        @Param("department") String department
    );

    @Query("SELECT r FROM Result r " +
           "JOIN FETCH r.student s " +
           "JOIN FETCH r.quiz q " +
           "WHERE s.studentRollNumber = :rollNumber")
    List<Result> findResultsByStudentRollNumber(
        @Param("rollNumber") String rollNumber
    );
}
