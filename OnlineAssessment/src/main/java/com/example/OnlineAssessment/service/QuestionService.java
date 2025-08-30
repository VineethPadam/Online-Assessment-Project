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

    public List<Questions> getQuestionsByQuizId(int quizId) {
        return questionRepo.findQuestionsByQuizId(quizId);
    }
}
