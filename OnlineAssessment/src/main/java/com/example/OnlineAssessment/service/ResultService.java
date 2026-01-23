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
import org.springframework.transaction.annotation.Transactional;

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

    // ================== Evaluate and save student result ==================
    public Result evaluateAndSaveResult(String rollNumber, String quizId,
            Map<String, String> answers) throws Exception {

        if (resultRepo.existsByStudent_StudentRollNumberAndQuiz_QuizId(rollNumber, quizId)) {
            throw new RuntimeException("You have already attempted this quiz.");
        }

        Student student = studentRepo.findByStudentRollNumber(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        int score = 0;

        for (Map.Entry<String, String> entry : answers.entrySet()) {
            Options correctOptionObj = optionsRepo.findByQuestion_QuestionId(entry.getKey()).orElse(null);

            if (correctOptionObj != null) {
                List<String> correctOptions = Arrays.stream(correctOptionObj.getCorrectOption().split(","))
                        .map(String::trim).toList();

                List<String> selectedOptions = Arrays.stream(entry.getValue().split(","))
                        .map(String::trim).toList();

                if (correctOptions.size() == selectedOptions.size()
                        && correctOptions.containsAll(selectedOptions)) {
                    score++;
                }
            }
        }

        Result result = new Result();
        result.setStudent(student);
        result.setQuiz(quiz);
        result.setScore(score);
        result.setSubmissionTime(java.time.LocalDateTime.now());
        result.setAnswers(objectMapper.writeValueAsString(answers));

        return resultRepo.save(result);
    }

    // ================== Fetch student results if published ==================
    public List<Result> getStudentResults(String rollNumber, String quizId) {
        Student student = studentRepo.findByStudentRollNumber(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        boolean published = quizService.areResultsPublished(
                quizId,
                student.getStudentSection(),
                student.getDepartment(),
                student.getStudentYear());

        if (!published) {
            throw new RuntimeException("Results for this quiz are not yet published for your batch.");
        }

        return resultRepo.findResultsByStudentAndQuiz(rollNumber, quizId);
    }

    // ================== Fetch all results by filter ==================
    public List<Result> getResultsByFilter(String section, String department, int year, String quizId) {
        return resultRepo.findResultsBySectionDepartmentYearAndQuiz(section, department, year, quizId);
    }

    // ================== Fetch raw student answers ==================
    public String getStudentAnswers(String rollNumber, String quizId) {
        Result result = resultRepo.findResultByStudentAndQuiz(rollNumber, quizId);
        return result != null ? result.getAnswers() : "{}";
    }

    // ================== Check if student has attempted ==================
    public boolean hasAttemptedQuiz(String rollNumber, String quizId) {
        return resultRepo.existsByStudent_StudentRollNumberAndQuiz_QuizId(rollNumber, quizId);
    }

    // ================== Get ranked results with all filters ==================
    @Transactional(readOnly = true)
    public List<Result> getRankedResults(String quizId,
            String department,
            String section,
            Integer year,
            String sortBy) {

        List<Result> results;

        boolean hasDepartment = department != null && !department.isBlank();
        boolean hasSection = section != null && !section.isBlank();
        boolean hasYear = year != null && year > 0;

        if (!hasDepartment && !hasSection && !hasYear) {
            results = resultRepo.findRankedByQuiz(quizId);

        } else if (hasDepartment && !hasSection && !hasYear) {
            results = resultRepo.findRankedByQuizAndDepartment(quizId, department);

        } else if (hasDepartment && hasSection && !hasYear) {
            results = resultRepo.findRankedByQuizDepartmentSection(quizId, department, section);

        } else if (hasDepartment && !hasSection && hasYear) {
            results = resultRepo.findRankedByQuizDepartmentYear(quizId, department, year);

        } else if (hasDepartment && hasSection && hasYear) {
            results = resultRepo.findRankedByQuizDepartmentSectionYear(quizId, department, section, year);

        } else {
            throw new RuntimeException("Invalid filter combination");
        }

        // ===== Assign ranks, calculate total marks, pass/fail =====
        int rankCounter = 1;
        for (int i = 0; i < results.size(); i++) {
            Result r = results.get(i);

            int totalMarks = r.getQuiz().getQuestions().size();
            r.setTotalMarks(totalMarks);

            r.setPassFail(((double) r.getScore() / totalMarks) * 100 >= 40 ? "Pass" : "Fail");

            if (i > 0 && r.getScore() == results.get(i - 1).getScore()) {
                r.setRank(results.get(i - 1).getRank());
            } else {
                r.setRank(rankCounter);
            }
            rankCounter++;
        }

        // ===== Sort final results =====
        if ("roll".equalsIgnoreCase(sortBy)) {
            results.sort(Comparator.comparing(r -> r.getStudent().getStudentRollNumber()));
        } else {
            results.sort(Comparator.comparing(Result::getRank));
        }

        return results;
    }

    // ================== Get Analysis for a specific student across all quizzes
    // ==================
    @Transactional(readOnly = true)
    public List<Result> getStudentAnalysis(String rollNumber) {
        // 1. Find all results for this student
        List<Result> studentResults = resultRepo.findResultsByStudent_StudentRollNumber(rollNumber);

        List<Result> analyzedResults = new ArrayList<>();

        // 2. For each result, calculate rank globally for that quiz
        for (Result myResult : studentResults) {
            String quizId = myResult.getQuiz().getQuizId();

            // Get ranked list for this quiz (this calculates totalMarks, passFail, and Rank
            // for everyone)
            // Passing null for filters to get global rank
            List<Result> allRanked = getRankedResults(quizId, null, null, null, "rank");

            // Find my result in the ranked list
            for (Result r : allRanked) {
                if (r.getStudent().getStudentRollNumber().equals(rollNumber)) {
                    // We found the enriched result object for this student
                    analyzedResults.add(r);
                    break;
                }
            }
        }

        return analyzedResults;
    }
}
