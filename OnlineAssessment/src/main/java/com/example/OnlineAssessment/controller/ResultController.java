package com.example.OnlineAssessment.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Result;
import com.example.OnlineAssessment.service.ResultService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/results")
@CrossOrigin(origins = "*")
public class ResultController {

    @Autowired
    private ResultService resultService;

    private ObjectMapper objectMapper = new ObjectMapper();

    // Submit quiz result
    @PostMapping("/submit")
    public ResponseEntity<Result> submitResult(@RequestBody Map<String, Object> payload) throws Exception {

        String rollNumber = (String) payload.get("rollNumber");
        // Check if quizId is numeric (internal ID) or String
        Object qIdObj = payload.get("quizId");
        Long quizId = qIdObj instanceof Number ? ((Number) qIdObj).longValue() : Long.parseLong(qIdObj.toString());

        @SuppressWarnings("unchecked")
        Map<String, String> answers = (Map<String, String>) payload.get("answers");

        Result result = resultService.evaluateAndSaveResult(rollNumber, quizId, answers);

        return ResponseEntity.ok(result);
    }

    // Get results by filter
    @GetMapping("/filter")
    public List<Result> getResultsByFilter(
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam Integer year,
            @RequestParam Long quizId) {
        return resultService.getResultsByFilter(section, department, year, quizId);
    }

    // Get student results for a quiz
    @GetMapping("/student")
    public List<Result> getStudentResults(
            @RequestParam String rollNumber,
            @RequestParam Long quizId) {
        return resultService.getStudentResults(rollNumber, quizId);
    }

    // Check if student has already attempted
    @GetMapping("/student/attempted")
    public boolean hasStudentAttempted(
            @RequestParam String rollNumber,
            @RequestParam Long quizId) {
        return resultService.hasAttemptedQuiz(rollNumber, quizId);
    }

    // Get all results for a student
    @GetMapping("/student/all")
    public ResponseEntity<?> getAllStudentResults(@RequestParam String rollNumber) {
        String authUser = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        if (!authUser.equalsIgnoreCase(rollNumber)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body("System Security: Unauthorized access to performance records.");
        }
        return ResponseEntity.ok(resultService.getAllStudentResults(rollNumber));
    }

    // Fetch student's submitted answers
    @GetMapping("/student/{rollNumber}/quiz/{quizId}/answers")
    public Map<String, String> getStudentAnswers(
            @PathVariable String rollNumber,
            @PathVariable Long quizId) throws Exception {

        String jsonAnswers = resultService.getStudentAnswers(rollNumber, quizId);
        return objectMapper.readValue(jsonAnswers, new TypeReference<Map<String, String>>() {
        });
    }

    @GetMapping("/faculty/ranking")
    public List<Result> getFacultyRanking(
            @RequestParam Long quizId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "rank") String sortBy) {

        return resultService.getRankedResults(quizId, department, section, year, sortBy);
    }

    @GetMapping("/analysis")
    public List<Result> getStudentAnalysis(@RequestParam String rollNumber) {
        return resultService.getAllStudentResults(rollNumber);
    }

    @RequestMapping(value = "/ping", method = { RequestMethod.GET, RequestMethod.HEAD })
    public ResponseEntity<Void> ping() {
        return ResponseEntity.ok().build();
    }
}
