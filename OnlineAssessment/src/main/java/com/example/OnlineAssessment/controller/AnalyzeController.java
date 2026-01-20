package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.service.AnalyzeService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/analyze")
@CrossOrigin(origins = "*")
public class AnalyzeController {

    private final AnalyzeService analyzeService;

    public AnalyzeController(AnalyzeService analyzeService) {
        this.analyzeService = analyzeService;
    }

    @GetMapping
    public Map<String, Map<String, Object>> analyze(
            @RequestParam String quizId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Integer year
    ) {
        return analyzeService.getPassFailAnalysis(quizId, department, section, year);
    }
}
