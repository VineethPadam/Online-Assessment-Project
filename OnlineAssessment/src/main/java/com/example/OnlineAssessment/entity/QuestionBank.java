package com.example.OnlineAssessment.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class QuestionBank {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Filters
    @ElementCollection(fetch = FetchType.EAGER)
    @Column(columnDefinition = "VARCHAR(255)")
    private List<String> companies; // TCS, Wipro, Infosys, etc.

    private String category; // Aptitude, Verbal, Coding
    private String topic; // Arrays, Percentages, Grammar, etc.
    private String difficulty; // Easy, Medium, Hard

    // Question Content
    @Column(columnDefinition = "LONGTEXT")
    private String questionText;

    @Column(columnDefinition = "LONGTEXT")
    private String questionImage;

    private String questionType; // MCQ, NUMERICAL, CODING

    // Options (Embedded for simplicity in Bank)
    @ElementCollection(fetch = FetchType.EAGER)
    @Column(columnDefinition = "LONGTEXT")
    private List<String> choices;

    @ElementCollection(fetch = FetchType.EAGER)
    @Column(columnDefinition = "LONGTEXT")
    private List<String> choiceImages;

    private String correctOption; // For MCQ/Numerical

    // Coding Specific
    @Column(columnDefinition = "LONGTEXT")
    private String inputFormat;
    @Column(columnDefinition = "LONGTEXT")
    private String outputFormat;
    @Column(columnDefinition = "LONGTEXT")
    private String sampleInput;
    @Column(columnDefinition = "LONGTEXT")
    private String sampleOutput;
    @Column(columnDefinition = "LONGTEXT")
    private String testCases;
    @Column(columnDefinition = "LONGTEXT")
    private String constraints;
    @Column(columnDefinition = "LONGTEXT")
    private String hints;

    // Default meta for when imported
    private double defaultMarks;
    private double defaultNegativeMarks;
    private Integer defaultTimeLimit;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public List<String> getCompanies() {
        return companies;
    }

    public void setCompanies(List<String> companies) {
        this.companies = companies;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getQuestionImage() {
        return questionImage;
    }

    public void setQuestionImage(String questionImage) {
        this.questionImage = questionImage;
    }

    public String getQuestionType() {
        return questionType;
    }

    public void setQuestionType(String questionType) {
        this.questionType = questionType;
    }

    public List<String> getChoices() {
        return choices;
    }

    public void setChoices(List<String> choices) {
        this.choices = choices;
    }

    public List<String> getChoiceImages() {
        return choiceImages;
    }

    public void setChoiceImages(List<String> choiceImages) {
        this.choiceImages = choiceImages;
    }

    public String getCorrectOption() {
        return correctOption;
    }

    public void setCorrectOption(String correctOption) {
        this.correctOption = correctOption;
    }

    public String getInputFormat() {
        return inputFormat;
    }

    public void setInputFormat(String inputFormat) {
        this.inputFormat = inputFormat;
    }

    public String getOutputFormat() {
        return outputFormat;
    }

    public void setOutputFormat(String outputFormat) {
        this.outputFormat = outputFormat;
    }

    public String getSampleInput() {
        return sampleInput;
    }

    public void setSampleInput(String sampleInput) {
        this.sampleInput = sampleInput;
    }

    public String getSampleOutput() {
        return sampleOutput;
    }

    public void setSampleOutput(String sampleOutput) {
        this.sampleOutput = sampleOutput;
    }

    public String getTestCases() {
        return testCases;
    }

    public void setTestCases(String testCases) {
        this.testCases = testCases;
    }

    public String getConstraints() {
        return constraints;
    }

    public void setConstraints(String constraints) {
        this.constraints = constraints;
    }

    public String getHints() {
        return hints;
    }

    public void setHints(String hints) {
        this.hints = hints;
    }

    public double getDefaultMarks() {
        return defaultMarks;
    }

    public void setDefaultMarks(double defaultMarks) {
        this.defaultMarks = defaultMarks;
    }

    public double getDefaultNegativeMarks() {
        return defaultNegativeMarks;
    }

    public void setDefaultNegativeMarks(double defaultNegativeMarks) {
        this.defaultNegativeMarks = defaultNegativeMarks;
    }

    public Integer getDefaultTimeLimit() {
        return defaultTimeLimit;
    }

    public void setDefaultTimeLimit(Integer defaultTimeLimit) {
        this.defaultTimeLimit = defaultTimeLimit;
    }
}
