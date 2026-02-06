package com.example.OnlineAssessment.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Result;
import com.example.OnlineAssessment.service.ResultService;
import com.example.OnlineAssessment.security.JwtUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/results")
@CrossOrigin(origins = "*")
public class ResultController {

    @Autowired
    private ResultService resultService;

    @Autowired
    private JwtUtil jwtUtil;

    private ObjectMapper objectMapper = new ObjectMapper();

    private Long getCollegeId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractCollegeId(authHeader.substring(7));
        }
        return null;
    }

    // Submit quiz result
    @PostMapping("/submit")
    public ResponseEntity<Result> submitResult(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> payload) throws Exception {

        String rollNumber = (String) payload.get("rollNumber");
        Long collegeId = getCollegeId(authHeader);
        // Check if quizId is numeric (internal ID) or String
        Object qIdObj = payload.get("quizId");
        Long quizId = qIdObj instanceof Number ? ((Number) qIdObj).longValue() : Long.parseLong(qIdObj.toString());

        @SuppressWarnings("unchecked")
        Map<String, String> answers = (Map<String, String>) payload.get("answers");

        Result result = resultService.evaluateAndSaveResult(rollNumber, quizId, answers, collegeId);

        return ResponseEntity.ok(result);
    }

    // Get results by filter
    @GetMapping("/filter")
    public List<Result> getResultsByFilter(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam Integer year,
            @RequestParam Long quizId) {
        Long collegeId = getCollegeId(authHeader);
        return resultService.getResultsByFilter(section, department, year, quizId, collegeId);
    }

    // Get student results for a quiz
    @GetMapping("/student")
    public List<Result> getStudentResults(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String rollNumber,
            @RequestParam Long quizId) {
        Long collegeId = getCollegeId(authHeader);
        return resultService.getStudentResults(rollNumber, quizId, collegeId);
    }

    // Check if student has already attempted
    @GetMapping("/student/attempted")
    public boolean hasStudentAttempted(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String rollNumber,
            @RequestParam Long quizId) {
        Long collegeId = getCollegeId(authHeader);
        return resultService.hasAttemptedQuiz(rollNumber, quizId, collegeId);
    }

    // Get all results for a student
    @GetMapping("/student/all")
    public ResponseEntity<?> getAllStudentResults(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String rollNumber) {
        String authUser = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        if (!authUser.equalsIgnoreCase(rollNumber)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body("System Security: Unauthorized access to performance records.");
        }
        Long collegeId = getCollegeId(authHeader);
        return ResponseEntity.ok(resultService.getAllStudentResults(rollNumber, collegeId));
    }

    // Fetch student's submitted answers
    @GetMapping("/student/{rollNumber}/quiz/{quizId}/answers")
    public Map<String, String> getStudentAnswers(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String rollNumber,
            @PathVariable Long quizId) throws Exception {

        Long collegeId = getCollegeId(authHeader);
        String jsonAnswers = resultService.getStudentAnswers(rollNumber, quizId, collegeId);
        return objectMapper.readValue(jsonAnswers, new TypeReference<Map<String, String>>() {
        });
    }

    @GetMapping("/faculty/ranking")
    public List<Result> getFacultyRanking(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam Long quizId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "rank") String sortBy) {

        Long collegeId = getCollegeId(authHeader);
        return resultService.getRankedResults(quizId, department, section, year, sortBy, collegeId);
    }

    @GetMapping("/analysis")
    public List<Result> getStudentAnalysis(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String rollNumber) {
        Long collegeId = getCollegeId(authHeader);
        return resultService.getAllStudentResults(rollNumber, collegeId);
    }

    @RequestMapping(value = "/ping", method = { RequestMethod.GET, RequestMethod.HEAD })
    public ResponseEntity<Void> ping() {
        return ResponseEntity.ok().build();
    }
}
