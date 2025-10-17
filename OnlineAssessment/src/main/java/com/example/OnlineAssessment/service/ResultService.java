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

    @Autowired
    private QuizService quizService;

    private ObjectMapper objectMapper = new ObjectMapper();

    // Evaluate and save student result
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
                List<String> correctOptions = Arrays.stream(correctOptionObj.getCorrectOption().split(","))
                        .map(String::trim)
                        .toList();

                List<String> selectedOptions = Arrays.stream(selectedOptionStr.split(","))
                        .map(String::trim)
                        .toList();

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

    // Fetch student answers only if results are published
    public List<Result> getStudentResults(String rollNumber, String quizId) {
        Student student = studentRepo.findByStudentRollNumber(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        boolean published = quizService.areResultsPublished(
                quizId,
                student.getStudentSection(),
                student.getDepartment(),
                student.getStudentYear()
        );

        if (!published) {
            throw new RuntimeException("Results for this quiz are not yet published for your batch.");
        }

        return resultRepo.findResultsByStudentAndQuiz(rollNumber, quizId);
    }

    // Fetch all results by filter
    public List<Result> getResultsByFilter(String section, String department, String year, String quizId) {
        return resultRepo.findResultsBySectionDepartmentYearAndQuiz(section, department, year, quizId);
    }

    // Fetch raw student answers (for faculty view)
    public String getStudentAnswers(String rollNumber, String quizId) {
        Result result = resultRepo.findResultByStudentAndQuiz(rollNumber, quizId);
        return result != null ? result.getAnswers() : "{}";
    }
}
