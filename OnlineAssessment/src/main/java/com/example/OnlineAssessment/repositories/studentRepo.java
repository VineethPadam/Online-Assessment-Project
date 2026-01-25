package com.example.OnlineAssessment.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.Student;

public interface studentRepo extends JpaRepository<Student, String> {

    Optional<Student> findByStudentRollNumberAndPassword(String rollNumber, String password);

    Optional<Student> findByStudentRollNumber(String studentRollNumber);

    java.util.List<Student> findByDepartmentAndStudentSectionAndStudentYear(String department, String section,
            Integer year);

    java.util.List<Student> findByDepartmentAndStudentSection(String department, String section);

    java.util.List<Student> findByDepartmentAndStudentYear(String department, Integer year);

    java.util.List<Student> findByDepartment(String department);

    java.util.List<Student> findByStudentSectionAndStudentYear(String section, Integer year);

    java.util.List<Student> findByStudentSection(String section);

    java.util.List<Student> findByStudentYear(Integer year);
}
