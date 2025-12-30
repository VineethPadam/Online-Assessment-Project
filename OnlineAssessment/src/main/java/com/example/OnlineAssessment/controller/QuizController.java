package com.example.OnlineAssessment.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.entity.QuizActivation;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.service.QuestionService;
import com.example.OnlineAssessment.service.QuizService;
import com.example.OnlineAssessment.service.StudentService;

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
    
    @Autowired
    StudentService studentService;
    // ✅ Get all active quizzes for a student
    @GetMapping("/active")
    public ResponseEntity<?> getActiveQuizzesForStudent(
            @RequestParam String rollNumber,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year) {

        Student student = studentService.getByRollNumber(rollNumber);

        // 🔐 Credential validation
        if (!student.getStudentSection().equalsIgnoreCase(section)
                || !student.getDepartment().equalsIgnoreCase(department)
                || student.getStudentYear() != year) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid credentials");
        }

        return ResponseEntity.ok(
                quizService.getActiveQuizzesForStudent(
                        student.getStudentSection(),
                        student.getDepartment(),
                        student.getStudentYear()
                )
        );
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
 // In QuizController
    @GetMapping("/questions/{questionId}/is-multiple")
    public boolean isQuestionMultiple(@PathVariable String questionId) {
        return questionService.isMultiple(questionId);
    }
    @PostMapping("/{quizId}/publish-result")
    public ResponseEntity<?> publishResult(
            @PathVariable String quizId,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @RequestParam boolean publish) {
        try {
            QuizActivation result = quizService.publishResults(quizId, section, department, year, publish);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }


}

