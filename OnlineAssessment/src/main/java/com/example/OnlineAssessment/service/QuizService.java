package com.example.OnlineAssessment.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.entity.QuizActivation;
import com.example.OnlineAssessment.repositories.QuizRepo;
import com.example.OnlineAssessment.repositories.QuizActivationRepo;

@Service
public class QuizService {

    @Autowired
    private QuizRepo quizRepo;

    @Autowired
    private QuizActivationRepo quizActivationRepo;

    // Create a new quiz if it doesn't exist
 // ✅ Create a new quiz ONLY if quizId is unique
    public Quiz createQuiz(String quizId, String quizName) {
        // Check if quizId already exists
        if (quizRepo.existsById(quizId)) {
            throw new RuntimeException("Quiz ID already exists! Please choose a unique Quiz ID.");
        }

        // Optional: Check if quizName is unique
        if (quizRepo.findByQuizNameIgnoreCase(quizName) != null) {
            throw new RuntimeException("Quiz Name already exists! Please choose a unique name.");
        }

        Quiz quiz = new Quiz();
        quiz.setQuizId(quizId);
        quiz.setQuizName(quizName);
        return quizRepo.save(quiz);
    }

    // Activate or deactivate a quiz for a specific batch
    public QuizActivation activateQuiz(String quizId, String section,
            String department, int year, boolean active, int durationMinutes) {

        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        QuizActivation qa = quizActivationRepo
                .findByQuizIdSectionDeptYearIgnoreCase(quizId, section, department, year);

        if (qa == null) {
            qa = new QuizActivation();
            qa.setQuiz(quiz);
            qa.setSection(section);
            qa.setDepartment(department);
            qa.setYear(year);
        }

        qa.setActive(active);
        qa.setDurationMinutes(durationMinutes);

        return quizActivationRepo.save(qa);
    }

 // Publish or unpublish results for a specific batch
    public QuizActivation publishResults(String quizId, String section, String department, int year, boolean publish) {
        // Step 1: Check if the quiz exists
        if (!quizRepo.existsById(quizId)) {
            throw new RuntimeException("Invalid Quiz ID");
        }

        // Step 2: Check if activation entry exists for that batch
        QuizActivation qa = quizActivationRepo.findByQuizIdSectionDeptYearIgnoreCase(quizId, section, department, year);
        if (qa == null) {
            throw new RuntimeException("Quiz not activated for the selected section/year");
        }

        // Step 3: Update publish status
        qa.setPublished(publish);
        return quizActivationRepo.save(qa);
    }


    // Check if results are published for a batch
    public boolean areResultsPublished(String quizId, String section, String department, int year) {
        QuizActivation qa = quizActivationRepo.findByQuizIdSectionDeptYearIgnoreCase(quizId, section, department, year);
        return qa != null && qa.isPublished();
    }

    // Get all active quizzes for a student
    public List<QuizActivation> getActiveQuizzesForStudent(String section, String department, int year) {
        return quizActivationRepo.findActiveQuizzesIgnoreCase(section, department, year);
    }

    // Check if a quiz is active for a student
    public boolean isQuizActiveForStudent(String quizId, String section, String department, int year) {
        QuizActivation qa = quizActivationRepo.findByQuizIdSectionDeptYearIgnoreCase(quizId, section, department, year);
        return qa != null && qa.isActive();
    }
}
