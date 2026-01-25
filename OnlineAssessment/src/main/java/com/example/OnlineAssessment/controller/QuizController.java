package com.example.OnlineAssessment.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.repositories.FacultyRepo;
import com.example.OnlineAssessment.repositories.QuizRepo;
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

    @Autowired
    private StudentService studentService;

    @Autowired
    private FacultyRepo facultyRepo;

    @Autowired
    private QuizRepo quizRepo;

    private String getCurrentFacultyId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Faculty faculty = facultyRepo.findByEmail(email);
        return faculty != null ? faculty.getFacultyId() : null;
    }

    // ✅ Create a new quiz
    @PostMapping("/create")
    public ResponseEntity<?> createQuiz(@RequestParam String quizId, @RequestParam String quizName) {
        try {
            String facultyId = getCurrentFacultyId();
            if (facultyId == null)
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");

            Quiz quiz = quizService.createQuiz(quizId, quizName, facultyId);
            return ResponseEntity.ok(quiz);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ✅ Get all exams conducted by me
    @GetMapping("/my-exams")
    public ResponseEntity<?> getMyExams() {
        String facultyId = getCurrentFacultyId();
        if (facultyId == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        return ResponseEntity.ok(quizRepo.findByFaculty_FacultyId(facultyId));
    }

    // ✅ Delete quiz
    @DeleteMapping("/{quizId}")
    public ResponseEntity<?> deleteQuiz(@PathVariable Long quizId) {
        try {
            quizService.deleteQuiz(quizId);
            return ResponseEntity.ok("Quiz deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ✅ Add single question
    @PostMapping("/{quizId}/questions/add")
    public ResponseEntity<?> addQuestion(
            @PathVariable Long quizId,
            @RequestBody Map<String, Object> payload) {
        try {
            String text = (String) payload.get("questionText");
            @SuppressWarnings("unchecked")
            List<String> options = (List<String>) payload.get("options");
            String correct = (String) payload.get("correctOption");
            double marks = Double.parseDouble(payload.get("marks").toString());
            double negMarks = Double.parseDouble(payload.get("negativeMarks").toString());
            Integer timeLimit = payload.get("timeLimit") != null ? Integer.parseInt(payload.get("timeLimit").toString())
                    : null;
            String questionImage = (String) payload.get("questionImage");
            @SuppressWarnings("unchecked")
            List<String> choiceImages = (List<String>) payload.get("choiceImages");

            Questions q = questionService.addQuestionToQuiz(quizId, text, options, correct, marks, negMarks, timeLimit,
                    questionImage, choiceImages);
            return ResponseEntity.ok(q);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ✅ Update question
    @PutMapping("/questions/{questionId}")
    public ResponseEntity<?> updateQuestion(
            @PathVariable String questionId,
            @RequestBody Map<String, Object> payload) {
        try {
            String text = (String) payload.get("questionText");
            @SuppressWarnings("unchecked")
            List<String> options = (List<String>) payload.get("options");
            String correct = (String) payload.get("correctOption");
            double marks = Double.parseDouble(payload.get("marks").toString());
            double negMarks = Double.parseDouble(payload.get("negativeMarks").toString());
            Integer timeLimit = payload.get("timeLimit") != null ? Integer.parseInt(payload.get("timeLimit").toString())
                    : null;
            String questionImage = (String) payload.get("questionImage");
            @SuppressWarnings("unchecked")
            List<String> choiceImages = (List<String>) payload.get("choiceImages");

            Questions q = questionService.updateQuestion(questionId, text, options, correct, marks, negMarks,
                    timeLimit, questionImage, choiceImages);
            return ResponseEntity.ok(q);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ✅ Delete question
    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<?> deleteQuestion(@PathVariable String questionId) {
        try {
            questionService.deleteQuestion(questionId);
            return ResponseEntity.ok("Question deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ✅ Activate or deactivate quiz
    @PostMapping("/activate")
    public ResponseEntity<?> activateQuiz(
            @RequestParam Long quizId,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @RequestParam boolean active,
            @RequestParam(defaultValue = "0") int durationMinutes) {

        try {
            quizService.activateQuiz(quizId, section, department, year, active, durationMinutes);
            return ResponseEntity.ok("Quiz activation updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ✅ Get all active quizzes for a student
    @GetMapping("/active")
    public ResponseEntity<?> getActiveQuizzesForStudent(
            @RequestParam String rollNumber,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year) {

        String authUser = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!authUser.equalsIgnoreCase(rollNumber)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Security Violation: You can only access your own active quizzes.");
        }

        Student student = studentService.getByRollNumber(rollNumber);

        if (student == null || !student.getStudentSection().equalsIgnoreCase(section)
                || !student.getDepartment().equalsIgnoreCase(department)
                || student.getStudentYear() != year) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid student details provided.");
        }

        return ResponseEntity.ok(quizService.getActiveQuizzesForStudent(section, department, year));
    }

    // ✅ Fetch questions for a student
    @GetMapping("/{quizId}/questions/for-student")
    public List<Questions> getQuestionsForStudent(
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @PathVariable Long quizId) {

        boolean isActive = quizService.isQuizActiveForStudent(quizId, section, department, year);
        if (!isActive) {
            throw new RuntimeException("Quiz is not active for your class.");
        }
        return questionService.getQuestionsByQuizId(quizId);
    }

    // ✅ Fetch questions by quizId (general use)
    @GetMapping("/{quizId}/questions")
    public List<Questions> getQuestionsByQuizId(@PathVariable Long quizId) {
        return questionService.getQuestionsByQuizId(quizId);
    }

    @GetMapping("/questions/{questionId}/is-multiple")
    public boolean isQuestionMultiple(@PathVariable String questionId) {
        return questionService.isMultiple(questionId);
    }

    @PostMapping("/{quizId}/publish-result")
    public ResponseEntity<String> publishResult(
            @PathVariable Long quizId,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @RequestParam boolean publish) {

        try {
            quizService.publishResults(quizId, section, department, year, publish);
            return ResponseEntity.ok(publish ? "Result published" : "Result unpublished");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
