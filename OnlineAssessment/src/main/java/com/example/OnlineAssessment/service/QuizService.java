package com.example.OnlineAssessment.service;

import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.entity.QuizActivation;
import com.example.OnlineAssessment.repositories.QuizRepo;
import com.example.OnlineAssessment.repositories.FacultyRepo;
import com.example.OnlineAssessment.repositories.QuizActivationRepo;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuizService {

    @Autowired
    private QuizRepo quizRepo;

    @Autowired
    private FacultyRepo facultyRepo;

    @Autowired
    private QuizActivationRepo quizActivationRepo;

    // Create a new quiz for a specific faculty
    public Quiz createQuiz(String quizCode, String quizName, String facultyId) {
        Optional<Quiz> existing = quizRepo.findByQuizCodeAndFaculty_FacultyId(quizCode, facultyId);
        if (existing.isPresent()) {
            throw new RuntimeException("You already have a quiz with ID: " + quizCode);
        }

        Faculty faculty = facultyRepo.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        Quiz quiz = new Quiz();
        quiz.setQuizCode(quizCode);
        quiz.setQuizName(quizName);
        quiz.setFaculty(faculty);
        return quizRepo.save(quiz);
    }

    // Activate or deactivate a quiz
    public QuizActivation activateQuiz(Long internalQuizId, String section,
            String department, int year, boolean active, int durationMinutes) {

        Quiz quiz = quizRepo.findById(internalQuizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        QuizActivation qa = quizActivationRepo
                .findByQuizIdAndSectionDeptYear(quiz.getId(), section, department, year);

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

    // Publish results
    public QuizActivation publishResults(Long internalQuizId, String section, String department, int year,
            boolean publish) {
        QuizActivation qa = quizActivationRepo.findByQuizIdAndSectionDeptYear(internalQuizId, section, department,
                year);
        if (qa == null) {
            throw new RuntimeException("Quiz not activated for this batch");
        }

        qa.setPublished(publish);
        return quizActivationRepo.save(qa);
    }

    public List<QuizActivation> getActiveQuizzesForStudent(String section, String department, int year) {
        return quizActivationRepo.findActiveQuizzesIgnoreCase(section, department, year);
    }

    public boolean isQuizActiveForStudent(Long internalQuizId, String section, String department, int year) {
        QuizActivation qa = quizActivationRepo.findByQuizIdAndSectionDeptYear(internalQuizId, section, department,
                year);
        return qa != null && qa.isActive();
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        quizRepo.deleteById(quizId);
    }
}
