package com.example.OnlineAssessment.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.repositories.QuestionRepo;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepo questionRepo;

    // Fetch questions by quizId
    public List<Questions> getQuestionsByQuizId(String quizId) {
        return questionRepo.findByQuiz_QuizId(quizId);
    }
}
