package com.example.OnlineAssessment.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.OnlineAssessment.entity.Options;
import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.entity.Result;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.repositories.OptionsRepo;
import com.example.OnlineAssessment.repositories.QuizRepo;
import com.example.OnlineAssessment.repositories.ResultRepo;
import com.example.OnlineAssessment.repositories.studentRepo;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class ResultService {

    @Autowired
    private ResultRepo resultRepo;

    @Autowired
    private studentRepo studentRepo;

    @Autowired
    private QuizRepo quizRepo;

    @Autowired
    private OptionsRepo optionsRepo;

    private ObjectMapper objectMapper = new ObjectMapper();

    // Evaluate score based on answers and save result (saves answers as JSON)
    public Result evaluateAndSaveResult(String rollNumber, String quizId, Map<String, String> answers) throws Exception {
        if (resultRepo.existsByStudent_StudentRollNumberAndQuiz_QuizId(rollNumber, quizId)) {
            throw new RuntimeException("You have already attempted this quiz.");
        }

        Student student = studentRepo.findByStudentRollNumber(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        int score = 0;

        for (Map.Entry<String, String> entry : answers.entrySet()) {
            String questionId = entry.getKey();
            String selectedOption = entry.getValue();

            Options correctOption = optionsRepo.findByQuestion_QuestionId(questionId);
            if (correctOption != null && correctOption.getCorrectOption().equalsIgnoreCase(selectedOption)) {
                score++;
            }
        }

        Result result = new Result();
        result.setStudent(student);
        result.setQuiz(quiz);
        result.setScore(score);

        // Save answers as JSON string
        String jsonAnswers = objectMapper.writeValueAsString(answers);
        result.setAnswers(jsonAnswers);

        return resultRepo.save(result);
    }

    // Fetch answers JSON for a student for a specific quiz
    public String getStudentAnswers(String rollNumber, String quizId) {
        Result result = resultRepo.findResultByStudentAndQuiz(rollNumber, quizId);
        if (result != null) {
            return result.getAnswers();
        }
        return "{}"; // empty map if not found
    }

    // Existing methods
    public List<Result> getResultsByFilter(String section, String department, String year, String quizId) {
        return resultRepo.findResultsBySectionDepartmentYearAndQuiz(section, department, year, quizId);
    }

    public List<Result> getStudentResults(String rollNumber, String quizId) {
        return resultRepo.findResultsByStudentAndQuiz(rollNumber, quizId);
    }
}
