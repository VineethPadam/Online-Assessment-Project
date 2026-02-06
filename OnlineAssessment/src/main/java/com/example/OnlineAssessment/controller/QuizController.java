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
import com.example.OnlineAssessment.security.JwtUtil;

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

    @Autowired
    private com.example.OnlineAssessment.repositories.QuestionRepo questionRepo;

    @Autowired
    private com.example.OnlineAssessment.service.SectionService sectionService;

    @Autowired
    private com.example.OnlineAssessment.service.CompilerService compilerService;

    @Autowired
    private JwtUtil jwtUtil;

    private String getCurrentFacultyId() {
        String authUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Faculty faculty = facultyRepo.findByEmail(authUser);
        return faculty != null ? faculty.getFacultyId() : null;
    }

    private Long getCurrentCollegeId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractCollegeId(authHeader.substring(7));
        }
        return null;
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
            String questionType = (String) payload.getOrDefault("questionType", "MCQ");
            String inputFormat = (String) payload.get("inputFormat");
            String outputFormat = (String) payload.get("outputFormat");
            String sampleInput = (String) payload.get("sampleInput");
            String sampleOutput = (String) payload.get("sampleOutput");
            String testCases = (String) payload.get("testCases");
            String constraints = (String) payload.get("constraints");
            String hints = (String) payload.get("hints");

            Questions q = questionService.addQuestionToQuiz(quizId, text, questionType, options, correct, marks,
                    negMarks, timeLimit,
                    questionImage, choiceImages, inputFormat, outputFormat, sampleInput, sampleOutput, testCases,
                    constraints, hints);
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
            String questionType = (String) payload.getOrDefault("questionType", "MCQ");
            String inputFormat = (String) payload.get("inputFormat");
            String outputFormat = (String) payload.get("outputFormat");
            String sampleInput = (String) payload.get("sampleInput");
            String sampleOutput = (String) payload.get("sampleOutput");
            String testCases = (String) payload.get("testCases");
            String constraints = (String) payload.get("constraints");
            String hints = (String) payload.get("hints");

            Questions q = questionService.updateQuestion(questionId, text, questionType, options, correct, marks,
                    negMarks,
                    timeLimit, questionImage, choiceImages, inputFormat, outputFormat, sampleInput, sampleOutput,
                    testCases, constraints, hints);
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
            @RequestHeader("Authorization") String authHeader,
            @RequestParam Long quizId,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @RequestParam boolean active,
            @RequestParam(defaultValue = "0") int durationMinutes,
            @RequestParam(required = false) String sectionConfigs,
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {

        try {
            Long collegeId = getCurrentCollegeId(authHeader);
            quizService.activateQuiz(quizId, section, department, year, active, durationMinutes, sectionConfigs,
                    startTime, endTime, collegeId);
            return ResponseEntity.ok("Quiz activation updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ✅ Get all active quizzes for a student
    @GetMapping("/active")
    public ResponseEntity<?> getActiveQuizzesForStudent(
            @RequestHeader("Authorization") String authHeader,
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
        Long collegeId = getCurrentCollegeId(authHeader);

        if (student == null || !student.getStudentSection().equalsIgnoreCase(section)
                || !student.getDepartment().equalsIgnoreCase(department)
                || student.getStudentYear() != year) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid student details provided.");
        }

        return ResponseEntity.ok(quizService.getActiveQuizzesForStudent(section, department, year, collegeId));
    }

    // ✅ Fetch sections and questions for a student
    @GetMapping("/{quizId}/sections/for-student")
    public List<?> getSectionsForStudent(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @PathVariable Long quizId) {

        Long collegeId = getCurrentCollegeId(authHeader);
        com.example.OnlineAssessment.entity.QuizActivation activation = quizService.getQuizActivation(quizId, section,
                department, year, collegeId);
        if (activation == null || !activation.isActive()) {
            throw new RuntimeException("Quiz is not active for your class.");
        }

        java.util.List<com.example.OnlineAssessment.entity.Section> sections = sectionService
                .getSectionsByQuizId(quizId);
        java.util.List<Questions> allQuestions = questionService.getQuestionsByQuizId(quizId);
        java.util.List<Questions> orphanedQuestions = allQuestions.stream().filter(q -> q.getSection() == null)
                .toList();

        java.util.Map<String, java.util.Map<String, Object>> configs = null;
        if (activation.getSectionConfigs() != null && !activation.getSectionConfigs().isEmpty()) {
            try {
                configs = new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                        activation.getSectionConfigs(),
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, java.util.Map<String, Object>>>() {
                        });
            } catch (Exception e) {
            }
        }

        // Get student roll from security context
        String roll = SecurityContextHolder.getContext().getAuthentication().getName();
        // Use hash of roll number + quizId as seed for consistent randomness per
        // student
        long seed = (roll + quizId).hashCode();
        java.util.Random studentRandom = new java.util.Random(seed);

        java.util.List<Object> finalSections = new java.util.ArrayList<>();

        if (!orphanedQuestions.isEmpty()) {
            java.util.Map<String, Object> cfg = (configs != null) ? configs.get("-1") : null;
            java.util.List<Questions> picked = pickRandom(orphanedQuestions, cfg, studentRandom);
            if (!picked.isEmpty()) {
                com.example.OnlineAssessment.entity.Section virtualSection = new com.example.OnlineAssessment.entity.Section();
                virtualSection.setId(-1L);
                virtualSection.setSectionName("General");
                virtualSection.setDescription("General questions for this exam");
                virtualSection.setQuestions(picked);
                finalSections.add(virtualSection);
            }
        }

        // Handle Real Sections
        for (com.example.OnlineAssessment.entity.Section sec : sections) {
            java.util.Map<String, Object> cfg = (configs != null) ? configs.get(sec.getId().toString()) : null;
            java.util.List<Questions> picked = pickRandom(sec.getQuestions(), cfg, studentRandom);
            sec.setQuestions(picked);
            finalSections.add(sec);
        }

        return finalSections;
    }

    private java.util.List<Questions> pickRandom(java.util.List<Questions> list, java.util.Map<String, Object> config,
            java.util.Random rnd) {
        if (list == null || list.isEmpty())
            return new java.util.ArrayList<>();

        // Always shuffle EVERYTHING first
        java.util.List<Questions> baseList = new java.util.ArrayList<>(list);
        java.util.Collections.shuffle(baseList, rnd);

        // Always shuffle options for each question
        for (Questions q : baseList) {
            if (q.getOptions() != null && q.getOptions().getChoices() != null) {
                java.util.List<String> choices = new java.util.ArrayList<>(q.getOptions().getChoices());

                // Smart Detection: If options contain position-dependent text, skip shuffling
                boolean isPositional = choices.stream().anyMatch(c -> {
                    String lc = c.toLowerCase();
                    return lc.contains("both") || lc.contains("above") || lc.contains("below")
                            || lc.contains("neither") || lc.contains("all of the");
                });
                if (isPositional)
                    continue;

                java.util.List<String> imgs = q.getOptions().getChoiceImages() != null
                        ? new java.util.ArrayList<>(q.getOptions().getChoiceImages())
                        : new java.util.ArrayList<>();

                // Keep images in sync with choices using the same shuffled indices
                java.util.List<Integer> indices = new java.util.ArrayList<>();
                for (int i = 0; i < choices.size(); i++)
                    indices.add(i);
                java.util.Collections.shuffle(indices, rnd);

                java.util.List<String> shuffledChoices = new java.util.ArrayList<>();
                java.util.List<String> shuffledImgs = new java.util.ArrayList<>();
                for (int idx : indices) {
                    shuffledChoices.add(choices.get(idx));
                    if (idx < imgs.size())
                        shuffledImgs.add(imgs.get(idx));
                }
                q.getOptions().setChoices(shuffledChoices);
                q.getOptions().setChoiceImages(shuffledImgs);
            }
        }

        if (config == null)
            return baseList;

        Integer count = (Integer) config.get("count");
        Double targetMarks = (config.get("targetMarks") != null) ? ((Number) config.get("targetMarks")).doubleValue()
                : 0.0;

        if (count == null || count <= 0)
            return baseList;

        if (targetMarks > 0) {
            // Pick N questions that sum to targetMarks.
            // baseList is already shuffled
            java.util.List<Questions> result = findSubset(baseList, count, targetMarks, 0, new java.util.ArrayList<>());
            if (result != null)
                return result;
        }

        // Fallback or if no targetMarks: already shuffled, just take N
        if (count > baseList.size())
            count = baseList.size();
        return baseList.subList(0, count);
    }

    private java.util.List<Questions> findSubset(java.util.List<Questions> list, int n, double target, int start,
            java.util.List<Questions> current) {
        if (current.size() == n) {
            double sum = current.stream().mapToDouble(Questions::getMarks).sum();
            return (Math.abs(sum - target) < 0.01) ? new java.util.ArrayList<>(current) : null;
        }
        if (start >= list.size())
            return null;

        // Try including list[start]
        current.add(list.get(start));
        java.util.List<Questions> found = findSubset(list, n, target, start + 1, current);
        if (found != null)
            return found;

        // Try excluding
        current.remove(current.size() - 1);
        return findSubset(list, n, target, start + 1, current);
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
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long quizId,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam int year,
            @RequestParam boolean publish) {

        try {
            Long collegeId = getCurrentCollegeId(authHeader);
            quizService.publishResults(quizId, section, department, year, publish, collegeId);
            return ResponseEntity.ok(publish ? "Result published" : "Result unpublished");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // ✅ Sections Endpoints
    @PostMapping("/{quizId}/sections")
    public ResponseEntity<?> createSection(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long quizId,
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        try {
            Long collegeId = getCurrentCollegeId(authHeader);
            return ResponseEntity.ok(sectionService.createSection(quizId, name, description, collegeId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{quizId}/sections")
    public ResponseEntity<?> getSections(@PathVariable Long quizId) {
        return ResponseEntity.ok(sectionService.getSectionsByQuizId(quizId));
    }

    @DeleteMapping("/sections/{sectionId}")
    public ResponseEntity<?> deleteSection(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long sectionId) {
        try {
            Long collegeId = getCurrentCollegeId(authHeader);
            sectionService.deleteSection(sectionId, collegeId);
            return ResponseEntity.ok("Section deleted");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/sections/{sectionId}/questions/add")
    public ResponseEntity<?> addQuestionToSection(
            @PathVariable Long sectionId,
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
            String questionType = (String) payload.getOrDefault("questionType", "MCQ");
            String inputFormat = (String) payload.get("inputFormat");
            String outputFormat = (String) payload.get("outputFormat");
            String sampleInput = (String) payload.get("sampleInput");
            String sampleOutput = (String) payload.get("sampleOutput");
            String testCases = (String) payload.get("testCases");
            String constraints = (String) payload.get("constraints");
            String hints = (String) payload.get("hints");

            Questions q = questionService.addQuestionToSection(sectionId, text, questionType, options, correct, marks,
                    negMarks,
                    timeLimit, questionImage, choiceImages, inputFormat, outputFormat, sampleInput, sampleOutput,
                    testCases, constraints, hints);
            return ResponseEntity.ok(q);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/compiler/run")
    public ResponseEntity<?> runCode(@RequestBody Map<String, String> payload) {
        String language = payload.get("language");
        String code = payload.get("code");
        String input = payload.get("input");

        if (language == null || code == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Language and code are required");
        }

        return ResponseEntity.ok(compilerService.execute(language, code, input));
    }

    @PostMapping("/compiler/evaluate")
    public ResponseEntity<?> evaluateCode(@RequestBody Map<String, String> payload) {
        String questionId = payload.get("questionId");
        String language = payload.get("language");
        String code = payload.get("code");

        if (questionId == null || language == null || code == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("questionId, language and code are required");
        }

        Questions q = questionRepo.findById(questionId).orElse(null);
        if (q == null)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Question not found");

        String testCasesJson = q.getTestCases();
        if (testCasesJson == null || testCasesJson.trim().isEmpty()) {
            // If no hidden test cases, just run against sample and report as passed if
            // sample passes
            com.example.OnlineAssessment.service.CompilerService.ExecutionResult sampleRes = compilerService
                    .execute(language, code, q.getSampleInput());
            return ResponseEntity.ok(Map.of("success", sampleRes.success, "results", List.of(sampleRes)));
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            List<Map<String, String>> testCases = mapper.readValue(testCasesJson,
                    new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, String>>>() {
                    });

            List<Map<String, Object>> reports = new java.util.ArrayList<>();
            int passedCount = 0;
            String compilationError = null;

            for (int i = 0; i < testCases.size(); i++) {
                Map<String, String> tc = testCases.get(i);
                com.example.OnlineAssessment.service.CompilerService.ExecutionResult res = compilerService
                        .execute(language, code, tc.get("input"));

                if (!res.success && res.error != null && res.error.contains("Compilation Error")) {
                    compilationError = res.error;
                    break;
                }

                boolean passed = res.success && res.output != null && res.output.trim().equals(tc.get("output").trim());
                if (passed)
                    passedCount++;

                reports.add(Map.of(
                        "testCaseIndex", i + 1,
                        "passed", passed,
                        "executionTimeMs", res.executionTimeMs,
                        "error", res.error != null ? res.error : ""));
            }

            if (compilationError != null) {
                return ResponseEntity.ok(Map.of("compilationError", compilationError, "status", "ERROR"));
            }

            return ResponseEntity.ok(Map.of(
                    "status", passedCount == testCases.size() ? "PASSED" : "FAILED",
                    "passedCount", passedCount,
                    "totalCount", testCases.size(),
                    "reports", reports));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid test cases format: " + e.getMessage());
        }
    }
}
