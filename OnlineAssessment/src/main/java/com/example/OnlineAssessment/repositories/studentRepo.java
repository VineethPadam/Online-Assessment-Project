package com.example.OnlineAssessment.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.Student;
import java.util.Optional;

public interface studentRepo extends JpaRepository<Student, String> {

    Optional<Student> findByStudentRollNumberAndStudentEmailAndDepartment(
        String rollNumber, String email, String department
    );
}
