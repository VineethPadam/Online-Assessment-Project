package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.entity.QuestionBank;
import com.example.OnlineAssessment.service.QuestionBankService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bank")
public class QuestionBankController {

    @Autowired
    private QuestionBankService questionBankService;

    public QuestionBankController(QuestionBankService service) {
        this.questionBankService = service;
        // Seed on startup (naive approach for demo)
        // In production, this would be a separate migration/script
    }

    @GetMapping("/companies")
    public List<String> getCompanies() {
        return questionBankService.getCompanies();
    }

    @GetMapping("/topics")
    public List<String> getTopics(@RequestParam String category) {
        return questionBankService.getTopics(category);
    }

    @GetMapping("/filter")
    public List<QuestionBank> filter(
            @RequestParam String company,
            @RequestParam String category,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String difficulty) {
        return questionBankService.filterQuestions(company, category, topic, difficulty);
    }

    @PostMapping("/import")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> importQuestions(@RequestBody Map<String, Object> body) {
        try {
            Long quizId = Long.valueOf(body.get("quizId").toString());
            Long sectionId = body.get("sectionId") != null ? Long.valueOf(body.get("sectionId").toString()) : null;
            List<String> bankIds = (List<String>) body.get("bankIds");

            questionBankService.importQuestionsToQuiz(quizId, sectionId, bankIds);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
