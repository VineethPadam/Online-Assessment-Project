package com.example.OnlineAssessment.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.Faculty;

public interface FacultyRepo extends JpaRepository<Faculty, String> {
	Faculty findByEmail(String email);

	java.util.List<Faculty> findByDepartmentAndCollegeId(String department, Long collegeId);

	java.util.Optional<Faculty> findByEmailAndCollegeId(String email, Long collegeId);

	java.util.List<Faculty> findByCollegeId(Long collegeId);
}
