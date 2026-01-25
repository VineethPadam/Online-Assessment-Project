package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.service.AnswerKeyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/answerkey")
@CrossOrigin(origins = "*")
public class AnswerKeyController {

    @Autowired
    private AnswerKeyService answerKeyService;

    // Get the answer key for a specific quiz & student
    @GetMapping("/{quizId}/{rollNo}")
    public List<Map<String, Object>> getAnswerKey(
            @PathVariable Long quizId,
            @PathVariable String rollNo) {
        return answerKeyService.generateAnswerKey(quizId, rollNo);
    }
}
