package com.example.OnlineAssessment.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.Questions;

public interface QuestionRepo extends JpaRepository<Questions, String> {  // ID is now String

    List<Questions> findByQuiz_QuizId(String quizId);
}
