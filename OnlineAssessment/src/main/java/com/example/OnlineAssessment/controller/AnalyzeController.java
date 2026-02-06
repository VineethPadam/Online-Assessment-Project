package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.service.AnalyzeService;
import com.example.OnlineAssessment.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/analyze")
@CrossOrigin(origins = "*")
public class AnalyzeController {

    private final AnalyzeService analyzeService;

    @Autowired
    private JwtUtil jwtUtil;

    public AnalyzeController(AnalyzeService analyzeService) {
        this.analyzeService = analyzeService;
    }

    @GetMapping
    public Map<String, Map<String, Object>> analyze(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam Long quizId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Integer year) {
        String token = authHeader.substring(7);
        Long collegeId = jwtUtil.extractCollegeId(token);
        return analyzeService.getPassFailAnalysis(quizId, department, section, year, collegeId);
    }
}
