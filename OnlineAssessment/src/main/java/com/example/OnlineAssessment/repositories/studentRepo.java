package com.example.OnlineAssessment.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.Student;

public interface studentRepo extends JpaRepository<Student, String> {

    Optional<Student> findByStudentRollNumberAndPassword(String rollNumber, String password);
    Optional<Student> findByStudentRollNumber(String studentRollNumber);
    
}
