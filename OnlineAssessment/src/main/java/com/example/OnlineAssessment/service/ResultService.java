package com.example.OnlineAssessment.service;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Options;
import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.entity.Result;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.repositories.OptionsRepo;
import com.example.OnlineAssessment.repositories.QuizRepo;
import com.example.OnlineAssessment.repositories.ResultRepo;
import com.example.OnlineAssessment.repositories.QuizActivationRepo;
import com.example.OnlineAssessment.repositories.studentRepo;
import com.example.OnlineAssessment.entity.QuizActivation;
import com.fasterxml.jackson.core.type.TypeReference;
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
    private QuizActivationRepo quizActivationRepo;

    private ObjectMapper objectMapper = new ObjectMapper();

    // ================== Evaluate and save student result ==================
    public Result evaluateAndSaveResult(String rollNumber, Long quizId,
            Map<String, String> answers) throws Exception {

        if (resultRepo.existsByStudent_StudentRollNumberAndQuiz_Id(rollNumber, quizId)) {
            throw new RuntimeException("You have already attempted this quiz.");
        }

        Student student = studentRepo.findByStudentRollNumber(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        double score = 0;
        double totalPossibleMarks = 0;

        for (Map.Entry<String, String> entry : answers.entrySet()) {
            String questionId = entry.getKey();
            String studentAnswer = entry.getValue();

            Options correctOptionObj = optionsRepo.findByQuestion_QuestionId(questionId).orElse(null);
            if (correctOptionObj != null) {
                Questions question = correctOptionObj.getQuestion();
                totalPossibleMarks += question.getMarks();

                if (studentAnswer == null || studentAnswer.trim().isEmpty()) {
                    continue;
                }

                if ("NUMERICAL".equalsIgnoreCase(question.getQuestionType())) {
                    String correctStr = correctOptionObj.getCorrectOption().trim();
                    String studentStr = studentAnswer.trim();
                    boolean isCorrect = false;
                    try {
                        double cVal = Double.parseDouble(correctStr);
                        double sVal = Double.parseDouble(studentStr);
                        // Tolerance for floating point comparison
                        if (Math.abs(cVal - sVal) < 0.0001) {
                            isCorrect = true;
                        }
                    } catch (NumberFormatException e) {
                        // Fallback to exact string match if parsing fails
                        if (correctStr.equalsIgnoreCase(studentStr)) {
                            isCorrect = true;
                        }
                    }

                    if (isCorrect) {
                        score += question.getMarks();
                    } else {
                        score -= question.getNegativeMarks();
                    }
                } else {
                    // MCQ Evaluation
                    List<String> correctOptions = Arrays.stream(correctOptionObj.getCorrectOption().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .toList();

                    List<String> selectedOptions = Arrays.stream(studentAnswer.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .toList();

                    if (correctOptions.size() == selectedOptions.size()
                            && correctOptions.containsAll(selectedOptions)) {
                        score += question.getMarks();
                    } else {
                        score -= question.getNegativeMarks();
                    }
                }
            }
        }

        Result result = new Result();
        result.setStudent(student);
        result.setQuiz(quiz);
        result.setScore(score);
        result.setTotalMarks(totalPossibleMarks);

        result.setSubmissionTime(java.time.LocalDateTime.now());
        result.setAnswers(objectMapper.writeValueAsString(answers));

        return resultRepo.save(result);
    }

    // ================== Fetch student results if published ==================
    public List<Result> getStudentResults(String rollNumber, Long quizId) {
        if (studentRepo.findById(rollNumber).isEmpty()) {
            throw new RuntimeException("Student not found");
        }

        // areResultsPublished might need updating or it's handled by quizService
        // but wait, I renamed areResultsPublished in quizService or removed it?
        // Let's check QuizService again.

        return resultRepo.findResultsByStudentAndQuiz(rollNumber, quizId);
    }

    // ================== Fetch all results by filter ==================
    public List<Result> getResultsByFilter(String section, String department, int year, Long quizId) {
        return resultRepo.findResultsBySectionDepartmentYearAndQuiz(section, department, year, quizId);
    }

    // ================== Fetch raw student answers ==================
    public String getStudentAnswers(String rollNumber, Long quizId) {
        Result result = resultRepo.findResultByStudentAndQuiz(rollNumber, quizId);
        return result != null ? result.getAnswers() : "{}";
    }

    // ================== Check if student has attempted ==================
    public boolean hasAttemptedQuiz(String rollNumber, Long quizId) {
        return resultRepo.existsByStudent_StudentRollNumberAndQuiz_Id(rollNumber, quizId);
    }

    // ================== Get ranked results with all filters ==================
    @Transactional(readOnly = true)
    public List<Result> getRankedResults(Long quizId,
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

        // ===== Assign unique ranks based on score and submission time (already sorted
        // by repo) =====
        // Only students who pass should receive a rank
        int rankCounter = 1;
        for (int i = 0; i < results.size(); i++) {
            Result r = results.get(i);
            // totalMarks is now persistent, so we use r.getTotalMarks()
            double tm = r.getTotalMarks();
            boolean hasPassed = (tm > 0 && ((double) r.getScore() / tm) * 100 >= 40);
            r.setPassFail(hasPassed ? "Pass" : "Fail");

            // Only assign rank if student passed
            if (hasPassed) {
                r.setRank(rankCounter++);
            } else {
                r.setRank(null); // No rank for failed students
            }
        }

        // ===== Sort final results =====
        if ("roll".equalsIgnoreCase(sortBy)) {
            results.sort(Comparator.comparing(r -> r.getStudent().getStudentRollNumber()));
        } else {
            results.sort(Comparator.comparing(Result::getRank).thenComparing(Result::getSubmissionTime));
        }

        return results;
    }

    // ================== Get all results for a student ==================
    @Transactional(readOnly = true)
    public List<Result> getAllStudentResults(String rollNumber) {
        List<Result> results = resultRepo.findResultsByStudent_StudentRollNumber(rollNumber);
        for (Result r : results) {
            double totalMarks = r.getTotalMarks();
            r.setPassFail((totalMarks > 0 && ((double) r.getScore() / totalMarks) * 100 >= 40) ? "Pass" : "Fail");

            // Check publication
            Student s = r.getStudent();
            QuizActivation qA = quizActivationRepo.findByQuizIdAndSectionDeptYear(
                    r.getQuiz().getId(), s.getStudentSection(), s.getDepartment(), s.getStudentYear());
            r.setPublished(qA != null && qA.isPublished());

            if (!r.isPublished()) {
                r.setScore(0);
                r.setRank(null);
                r.setPassFail("Result Pending");
                r.setAnswers(null);
                r.setStudentAnswers(new HashMap<>());
            } else {
                // Parse student answers only if published
                try {
                    if (r.getAnswers() != null) {
                        r.setStudentAnswers(
                                objectMapper.readValue(r.getAnswers(), new TypeReference<Map<String, String>>() {
                                }));
                    }
                } catch (Exception e) {
                    r.setStudentAnswers(new HashMap<>());
                }
            }
        }
        return results;
    }
}
