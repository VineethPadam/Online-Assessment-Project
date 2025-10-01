package com.example.OnlineAssessment.service;

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

import java.util.*;

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

        // Fetch the student's result
        Result result = resultRepo.findResultByStudentAndQuiz(rollNo, quizId);
        if (result == null) return Collections.emptyList();

        // Parse answers JSON
        Map<String, String> studentAnswers;
        try {
            studentAnswers = objectMapper.readValue(result.getAnswers(),
                    new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Error parsing student answers", e);
        }

        List<Map<String, Object>> response = new ArrayList<>();

        // Iterate over each question answered by the student
        for (Map.Entry<String, String> entry : studentAnswers.entrySet()) {
            String questionId = entry.getKey();
            String selectedOption = entry.getValue();

            Questions question = questionRepo.findById(questionId).orElse(null);
            Options option = optionsRepo.findByQuestion_QuestionId(questionId);

            if (question == null || option == null) continue;

            Map<String, Object> qData = new HashMap<>();
            qData.put("questionId", questionId);
            qData.put("questionText", question.getQuestionText());
            qData.put("option1", option.getOption1());
            qData.put("option2", option.getOption2());
            qData.put("option3", option.getOption3());
            qData.put("option4", option.getOption4());
            qData.put("correctOption", option.getCorrectOption());
            qData.put("selectedOption", selectedOption);

            response.add(qData);
        }

        return response;
    }
}
