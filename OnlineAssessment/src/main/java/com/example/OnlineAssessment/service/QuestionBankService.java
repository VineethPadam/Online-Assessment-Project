package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.*;
import com.example.OnlineAssessment.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;

@Service
public class QuestionBankService {

    @Autowired
    private QuestionBankRepo questionBankRepo;

    @Autowired
    private QuestionRepo questionRepo; // To save copied questions

    @Autowired
    private QuizRepo quizRepo;

    @Autowired
    private SectionRepo sectionRepo;

    @Autowired
    private OptionsRepo optionsRepo;

    @Autowired
    private CompanyRepo companyRepo;

    public List<String> getCompanies() {
        // Return all registered companies from the Company entity
        return companyRepo.findAll().stream()
                .map(Company::getName)
                .collect(java.util.stream.Collectors.toList());
    }

    public List<String> getTopics(String category) {
        return questionBankRepo.findDistinctTopics(category);
    }

    public List<QuestionBank> filterQuestions(String company, String category, String topic, String difficulty) {
        if (topic != null && !topic.isEmpty() && difficulty != null && !difficulty.isEmpty()) {
            return questionBankRepo.findByCompanyAndCategoryAndTopicAndDifficulty(company, category, topic, difficulty);
        } else if (topic != null && !topic.isEmpty()) {
            return questionBankRepo.findByCompanyAndCategoryAndTopic(company, category, topic);
        } else {
            return questionBankRepo.findByCompanyAndCategory(company, category);
        }
    }

    @Transactional
    public void importQuestionsToQuiz(Long quizId, Long sectionId, List<String> bankIds) {
        if (quizId == null)
            throw new IllegalArgumentException("Quiz ID cannot be null");

        Quiz quiz = quizRepo.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz not found"));
        Section section = null;
        if (sectionId != null) {
            section = sectionRepo.findById(sectionId).orElse(null);
        }

        if (bankIds == null)
            return;

        for (String bankId : bankIds) {
            if (bankId == null)
                continue;
            QuestionBank qb = questionBankRepo.findById(bankId).orElse(null);
            if (qb == null)
                continue;

            Questions newQ = new Questions();
            newQ.setQuestionText(qb.getQuestionText());
            newQ.setQuestionImage(qb.getQuestionImage());
            newQ.setQuestionType(qb.getQuestionType());
            newQ.setMarks(qb.getDefaultMarks() > 0 ? qb.getDefaultMarks() : 1.0);
            newQ.setNegativeMarks(qb.getDefaultNegativeMarks());
            newQ.setTimeLimitSeconds(qb.getDefaultTimeLimit());
            newQ.setInputFormat(qb.getInputFormat());
            newQ.setOutputFormat(qb.getOutputFormat());
            newQ.setSampleInput(qb.getSampleInput());
            newQ.setSampleOutput(qb.getSampleOutput());
            newQ.setTestCases(qb.getTestCases());
            newQ.setConstraints(qb.getConstraints());
            newQ.setHints(qb.getHints());

            newQ.setQuiz(quiz);
            newQ.setSection(section);

            newQ = questionRepo.save(newQ);

            if (qb.getChoices() != null && !qb.getChoices().isEmpty()) {
                Options opts = new Options();
                opts.setChoices(new ArrayList<>(qb.getChoices()));
                opts.setChoiceImages(new ArrayList<>(qb.getChoiceImages()));
                opts.setCorrectOption(qb.getCorrectOption());
                opts.setQuestion(newQ);
                optionsRepo.save(opts);
                newQ.setOptions(opts);
                questionRepo.save(newQ);
            } else if ("NUMERICAL".equals(qb.getQuestionType())) {
                if (qb.getCorrectOption() != null) {
                    Options opts = new Options();
                    opts.setCorrectOption(qb.getCorrectOption());
                    opts.setQuestion(newQ);
                    optionsRepo.save(opts);
                    newQ.setOptions(opts);
                    questionRepo.save(newQ);
                }
            }
        }
    }
}
