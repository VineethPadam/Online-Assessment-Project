package com.example.OnlineAssessment.service;

import java.util.*;
import com.example.OnlineAssessment.entity.Options;
import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.entity.Result;
import com.example.OnlineAssessment.repositories.OptionsRepo;
import com.example.OnlineAssessment.repositories.QuestionRepo;
import com.example.OnlineAssessment.repositories.ResultRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AnswerKeyService {

    @Autowired
    private ResultRepo resultRepo;

    @Autowired
    private QuestionRepo questionRepo;

    @Autowired
    private OptionsRepo optionsRepo;

    private ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> generateAnswerKey(String quizId, String rollNo) {
        Result result = resultRepo.findResultByStudentAndQuiz(rollNo, quizId);
        if (result == null) return Collections.emptyList();

        Map<String, String> studentAnswers;
        try {
            studentAnswers = objectMapper.readValue(result.getAnswers(), new TypeReference<>() {});
        } catch (Exception e) {
            throw new RuntimeException("Error parsing student answers", e);
        }

        List<Map<String, Object>> response = new ArrayList<>();

        for (Map.Entry<String, String> entry : studentAnswers.entrySet()) {
            String questionId = entry.getKey();
            String selectedOption = entry.getValue();

            Questions question = questionRepo.findById(questionId).orElse(null);
            Options option = optionsRepo.findByQuestion_QuestionId(questionId).orElse(null);
            if (question == null || option == null) continue;

            Map<String, Object> qData = new HashMap<>();
            qData.put("questionId", questionId);
            qData.put("questionText", question.getQuestionText());
            qData.put("option1", option.getOption1());
            qData.put("option2", option.getOption2());
            qData.put("option3", option.getOption3());
            qData.put("option4", option.getOption4());
            qData.put("correctOption", option.getCorrectOption()); // comma-separated
            qData.put("selectedOption", selectedOption); // comma-separated

            response.add(qData);
        }

        return response;
    }
}
