package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.QuizActivation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface QuizActivationRepo extends JpaRepository<QuizActivation, Integer> {

	// Case-insensitive fetch for active quizzes (college scoped)
	@Query("SELECT q FROM QuizActivation q " +
			"WHERE UPPER(q.section) = UPPER(:section) " +
			"AND UPPER(q.department) = UPPER(:department) " +
			"AND q.year = :year " +
			"AND q.quiz.faculty.college.id = :collegeId")
	List<QuizActivation> findActiveQuizzesIgnoreCase(
			@Param("section") String section,
			@Param("department") String department,
			@Param("year") int year,
			@Param("collegeId") Long collegeId);

	// Case-insensitive check if a specific quiz is active for a student (college
	// scoped)
	@Query("SELECT q FROM QuizActivation q " +
			"WHERE q.quiz.id = :quizId " +
			"AND UPPER(q.section) = UPPER(:section) " +
			"AND UPPER(q.department) = UPPER(:department) " +
			"AND q.year = :year " +
			"AND q.quiz.faculty.college.id = :collegeId")
	QuizActivation findByQuizIdAndSectionDeptYear(
			@Param("quizId") Long quizId,
			@Param("section") String section,
			@Param("department") String department,
			@Param("year") int year,
			@Param("collegeId") Long collegeId);
}
