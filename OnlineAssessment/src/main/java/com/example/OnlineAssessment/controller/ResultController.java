package com.example.OnlineAssessment.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
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
    public Result submitResult(@RequestBody Map<String, Object> payload) throws Exception {
        String rollNumber = (String) payload.get("rollNumber");
        String quizId = (String) payload.get("quizId");

        @SuppressWarnings("unchecked")
        Map<String, String> answers = (Map<String, String>) (Map<?, ?>) payload.get("answers");

        return resultService.evaluateAndSaveResult(rollNumber, quizId, answers);
    }

    // Get results by filter
    @GetMapping("/filter")
    public List<Result> getResultsByFilter(
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam String year,
            @RequestParam String quizId) {
        return resultService.getResultsByFilter(section, department, year, quizId);
    }

    // Get student results for a quiz
    @GetMapping("/student")
    public List<Result> getStudentResults(
            @RequestParam String rollNumber,
            @RequestParam String quizId) {
        return resultService.getStudentResults(rollNumber, quizId);
    }

    // Check if student has already attempted a quiz
    @GetMapping("/student/attempted")
    public boolean hasStudentAttempted(
            @RequestParam String rollNumber,
            @RequestParam String quizId) {
        return resultService.getStudentResults(rollNumber, quizId).size() > 0;
    }

    // ✅ New endpoint: fetch student's submitted answers
    @GetMapping("/student/{rollNumber}/quiz/{quizId}/answers")
    public Map<String, String> getStudentAnswers(
            @PathVariable String rollNumber,
            @PathVariable String quizId) throws Exception {

        String jsonAnswers = resultService.getStudentAnswers(rollNumber, quizId);
        Map<String, String> answersMap = objectMapper.readValue(jsonAnswers, new TypeReference<Map<String, String>>() {});
        return answersMap;
    }

}
