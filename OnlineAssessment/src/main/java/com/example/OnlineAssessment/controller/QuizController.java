package com.example.OnlineAssessment.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.service.QuestionService;

@RestController
@RequestMapping("/quiz")
@CrossOrigin(origins = "*")
public class QuizController {
    
    @Autowired
    private QuestionService questionService;

    @GetMapping("/{quizId}/questions")
    public List<Questions> getQuestions(@PathVariable int quizId) {
        return questionService.getQuestionsByQuizId(quizId);
    }
}
