package com.example.OnlineAssessment.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.Student;

public interface studentRepo extends JpaRepository<Student, String> {

    Optional<Student> findByStudentRollNumberAndPassword(String rollNumber, String password);

    Optional<Student> findByStudentRollNumber(String studentRollNumber);

    Optional<Student> findByStudentRollNumberAndCollegeId(String studentRollNumber, Long collegeId);

    java.util.List<Student> findByCollegeId(Long collegeId);

    java.util.List<Student> findByDepartmentAndStudentSectionAndStudentYearAndCollegeId(String department,
            String section,
            Integer year, Long collegeId);

    java.util.List<Student> findByDepartmentAndStudentSectionAndCollegeId(String department, String section,
            Long collegeId);

    java.util.List<Student> findByDepartmentAndStudentYearAndCollegeId(String department, Integer year, Long collegeId);

    java.util.List<Student> findByDepartmentAndCollegeId(String department, Long collegeId);

    java.util.List<Student> findByStudentSectionAndStudentYearAndCollegeId(String section, Integer year,
            Long collegeId);

    java.util.List<Student> findByStudentSectionAndCollegeId(String section, Long collegeId);

    java.util.List<Student> findByStudentYearAndCollegeId(Integer year, Long collegeId);
}
