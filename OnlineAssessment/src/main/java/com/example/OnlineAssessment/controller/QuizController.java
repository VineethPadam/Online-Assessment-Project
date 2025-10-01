package com.example.OnlineAssessment.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.entity.QuizActivation;
import com.example.OnlineAssessment.service.QuestionService;
import com.example.OnlineAssessment.service.QuizService;

@RestController
@RequestMapping("/quiz")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuestionService questionService;

    // ✅ Create a new quiz
    @PostMapping("/create")
    public Quiz createQuiz(@RequestParam String quizId, @RequestParam String quizName) {
        return quizService.createQuiz(quizId, quizName);
    }

    // ✅ Activate or deactivate quiz for a specific section/department/year
    @PostMapping("/activate")
    public QuizActivation activateQuiz(
            @RequestParam String quizId,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @RequestParam boolean active) {
        return quizService.activateQuiz(quizId, section, department, year, active);
    }

    // ✅ Get all active quizzes for a student
    @GetMapping("/active")
    public List<QuizActivation> getActiveQuizzesForStudent(
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year) {

        List<QuizActivation> activeQuizzes = quizService.getActiveQuizzesForStudent(section, department, year);
        
        return activeQuizzes;
    }

    // ✅ Fetch questions for a student only if quiz is active
    @GetMapping("/{quizId}/questions/for-student")
    public List<Questions> getQuestionsForStudent(
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @PathVariable String quizId) {

        boolean isActive = quizService.isQuizActiveForStudent(quizId, section, department, year);
        if (!isActive) {
            throw new RuntimeException("You cannot attempt this quiz. Quiz is not active for your class.");
        }
        return questionService.getQuestionsByQuizId(quizId);
    }

    // ✅ Fetch questions by quizId (general use)
    @GetMapping("/{quizId}/questions")
    public List<Questions> getQuestionsByQuizId(@PathVariable String quizId) {
        return questionService.getQuestionsByQuizId(quizId);
    }
}
