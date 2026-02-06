package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.service.AnswerKeyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/answerkey")
@CrossOrigin(origins = "*")
public class AnswerKeyController {

    @Autowired
    private AnswerKeyService answerKeyService;

    @Autowired
    private com.example.OnlineAssessment.security.JwtUtil jwtUtil;

    // Get the answer key for a specific quiz & student
    @GetMapping("/{quizId}/{rollNo}")
    public ResponseEntity<?> getAnswerKey(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long quizId,
            @PathVariable String rollNo) {
        String authUser = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getName();
        if (!authUser.equalsIgnoreCase(rollNo)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body("Security Violation: You can only access your own answer key.");
        }
        Long collegeId = jwtUtil.extractCollegeId(authHeader.substring(7));
        return ResponseEntity.ok(answerKeyService.generateAnswerKey(quizId, rollNo, collegeId));
    }
}
