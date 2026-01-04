package com.example.OnlineAssessment.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.OnlineAssessment.entity.Options;
import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.repositories.OptionsRepo;
import com.example.OnlineAssessment.repositories.QuestionRepo;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepo questionRepo;

    @Autowired
    private OptionsRepo optionsRepo;

    // Fetch questions by quizId
    public List<Questions> getQuestionsByQuizId(String quizId) {
        return questionRepo.findByQuiz_QuizId(quizId);
    }

    public boolean isMultiple(String questionId) {
        Options opt = optionsRepo.findByQuestion_QuestionId(questionId).orElse(null);
        if (opt == null || opt.getCorrectOption() == null) return false;
        // multiple if comma-separated
        return opt.getCorrectOption().contains(",");
    }
}