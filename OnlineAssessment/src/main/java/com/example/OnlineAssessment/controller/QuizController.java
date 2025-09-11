package com.example.OnlineAssessment.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.service.QuestionService;

@RestController
@RequestMapping("/quiz")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuestionService questionService;

    @GetMapping("/{quizId}/questions")
    public List<Questions> getQuestions(@PathVariable int quizId){
        return questionService.getQuestionsByQuizId(quizId);
    }
}
