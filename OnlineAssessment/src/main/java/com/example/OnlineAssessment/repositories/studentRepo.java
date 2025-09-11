package com.example.OnlineAssessment.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.OnlineAssessment.entity.Student;

public interface studentRepo extends JpaRepository<Student, String> {
	 Optional<Student> findByStudentRollNumberAndStudentEmailAndDepartmentAndStudentYear(
		        String rollNumber, String email, String department, int Year
		    );
}
