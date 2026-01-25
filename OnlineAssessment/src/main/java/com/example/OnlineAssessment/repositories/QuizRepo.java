package com.example.OnlineAssessment.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.Quiz;

public interface QuizRepo extends JpaRepository<Quiz, Long> {
	Quiz findByQuizNameIgnoreCase(String quizName);

	List<Quiz> findByFaculty_FacultyId(String facultyId);

	Optional<Quiz> findByQuizCodeAndFaculty_FacultyId(String quizCode, String facultyId);
}
