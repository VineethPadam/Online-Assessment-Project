package com.example.OnlineAssessment.service;

import java.util.*;
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
            String selectedOptionStr = entry.getValue();

            Options correctOptionObj = optionsRepo.findByQuestion_QuestionId(questionId).orElse(null);
            if (correctOptionObj != null) {
                // Parse correct options as list
                List<String> correctOptions = Arrays.stream(correctOptionObj.getCorrectOption().split(","))
                        .map(String::trim)
                        .toList();

                // Parse selected options as list (comma-separated for multiple selection)
                List<String> selectedOptions = Arrays.stream(selectedOptionStr.split(","))
                        .map(String::trim)
                        .toList();

                // ✅ Award point only if sets match exactly
                if (correctOptions.size() == selectedOptions.size() && correctOptions.containsAll(selectedOptions)) {
                    score++;
                }
            }
        }

        Result result = new Result();
        result.setStudent(student);
        result.setQuiz(quiz);
        result.setScore(score);
        result.setAnswers(objectMapper.writeValueAsString(answers));

        return resultRepo.save(result);
    }

    public String getStudentAnswers(String rollNumber, String quizId) {
        Result result = resultRepo.findResultByStudentAndQuiz(rollNumber, quizId);
        return result != null ? result.getAnswers() : "{}";
    }

    public List<Result> getResultsByFilter(String section, String department, String year, String quizId) {
        return resultRepo.findResultsBySectionDepartmentYearAndQuiz(section, department, year, quizId);
    }

    public List<Result> getStudentResults(String rollNumber, String quizId) {
        return resultRepo.findResultsByStudentAndQuiz(rollNumber, quizId);
    }
}
