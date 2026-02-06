package com.example.OnlineAssessment.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.OnlineAssessment.entity.Options;
import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.repositories.OptionsRepo;
import com.example.OnlineAssessment.repositories.QuestionRepo;
import com.example.OnlineAssessment.repositories.QuizRepo;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestionService {

    @Autowired
    private QuestionRepo questionRepo;

    @Autowired
    private OptionsRepo optionsRepo;

    @Autowired
    private QuizRepo quizRepo;

    @Autowired
    private com.example.OnlineAssessment.repositories.SectionRepo sectionRepo;

    // Fetch questions by internal quiz ID
    public List<Questions> getQuestionsByQuizId(Long quizId) {
        return questionRepo.findByQuiz_Id(quizId);
    }

    public List<Questions> getQuestionsBySectionId(Long sectionId) {
        return questionRepo.findBySection_Id(sectionId);
    }

    public boolean isMultiple(String questionId) {
        Options opt = optionsRepo.findByQuestion_QuestionId(questionId).orElse(null);
        if (opt == null || opt.getCorrectOption() == null)
            return false;
        return opt.getCorrectOption().contains(",");
    }

    @Transactional
    public Questions addQuestionToSection(Long sectionId, String questionText, String questionType,
            List<String> choices,
            String correctOption, double marks, double negativeMarks, Integer timeLimitSeconds,
            String questionImage, List<String> choiceImages,
            String inputFormat, String outputFormat, String sampleInput, String sampleOutput, String testCases,
            String constraints, String hints) {
        com.example.OnlineAssessment.entity.Section section = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Section not found"));

        Questions question = new Questions();
        question.setQuestionText(questionText);
        question.setQuestionType(questionType);
        question.setQuiz(section.getQuiz());
        question.setSection(section);
        question.setMarks(marks);
        question.setNegativeMarks(negativeMarks);
        question.setTimeLimitSeconds(timeLimitSeconds);
        question.setQuestionImage(questionImage);
        question.setInputFormat(inputFormat);
        question.setOutputFormat(outputFormat);
        question.setSampleInput(sampleInput);
        question.setSampleOutput(sampleOutput);
        question.setTestCases(testCases);
        question.setConstraints(constraints);
        question.setHints(hints);

        Options options = new Options();
        options.setChoices(choices);
        options.setChoiceImages(choiceImages);
        options.setCorrectOption(correctOption);
        options.setQuestion(question);

        question.setOptions(options);

        return questionRepo.save(question);
    }

    @Transactional
    public Questions addQuestionToQuiz(Long internalQuizId, String questionText, String questionType,
            List<String> choices,
            String correctOption, double marks, double negativeMarks, Integer timeLimitSeconds,
            String questionImage, List<String> choiceImages,
            String inputFormat, String outputFormat, String sampleInput, String sampleOutput, String testCases,
            String constraints, String hints) {
        Quiz quiz = quizRepo.findById(internalQuizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        Questions question = new Questions();
        question.setQuestionText(questionText);
        question.setQuestionType(questionType);
        question.setQuiz(quiz);
        question.setMarks(marks);
        question.setNegativeMarks(negativeMarks);
        question.setTimeLimitSeconds(timeLimitSeconds);
        question.setQuestionImage(questionImage);
        question.setInputFormat(inputFormat);
        question.setOutputFormat(outputFormat);
        question.setSampleInput(sampleInput);
        question.setSampleOutput(sampleOutput);
        question.setTestCases(testCases);
        question.setConstraints(constraints);
        question.setHints(hints);

        Options options = new Options();
        options.setChoices(choices);
        options.setChoiceImages(choiceImages);
        options.setCorrectOption(correctOption);
        options.setQuestion(question);

        question.setOptions(options);

        return questionRepo.save(question);
    }

    @Transactional
    public Questions updateQuestion(String questionId, String questionText, String questionType, List<String> choices,
            String correctOption, double marks, double negativeMarks, Integer timeLimitSeconds,
            String questionImage, List<String> choiceImages,
            String inputFormat, String outputFormat, String sampleInput, String sampleOutput, String testCases,
            String constraints, String hints) {
        Questions question = questionRepo.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        question.setQuestionText(questionText);
        question.setQuestionType(questionType);
        question.setMarks(marks);
        question.setNegativeMarks(negativeMarks);
        question.setTimeLimitSeconds(timeLimitSeconds);
        question.setQuestionImage(questionImage);
        question.setInputFormat(inputFormat);
        question.setOutputFormat(outputFormat);
        question.setSampleInput(sampleInput);
        question.setSampleOutput(sampleOutput);
        question.setTestCases(testCases);
        question.setConstraints(constraints);
        question.setHints(hints);

        Options options = question.getOptions();
        if (options == null) {
            options = new Options();
            options.setQuestion(question);
        }
        options.setChoices(choices);
        options.setChoiceImages(choiceImages);
        options.setCorrectOption(correctOption);
        question.setOptions(options);

        return questionRepo.save(question);
    }

    @Transactional
    public void deleteQuestion(String questionId) {
        questionRepo.deleteById(questionId);
    }
}