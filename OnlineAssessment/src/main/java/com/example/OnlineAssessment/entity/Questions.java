package com.example.OnlineAssessment.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;

@Entity
public class Questions {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private String questionId;

    @Column(columnDefinition = "LONGTEXT")
    private String questionText;

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Quiz quiz;

    @ManyToOne
    @JoinColumn(name = "section_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Section section;

    @com.fasterxml.jackson.annotation.JsonProperty("sectionId")
    public Long getSectionIdForJson() {
        return section != null ? section.getId() : null;
    }

    @OneToOne(mappedBy = "question", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private Options options;

    private double marks;
    private double negativeMarks;
    private Integer timeLimitSeconds; // optional, null if no limit

    @Column(columnDefinition = "LONGTEXT")
    private String questionImage; // stores Base64 string

    private String questionType; // "MCQ", "NUMERICAL", or "CODING"

    @Column(columnDefinition = "LONGTEXT")
    private String inputFormat;
    @Column(columnDefinition = "LONGTEXT")
    private String outputFormat;
    @Column(columnDefinition = "LONGTEXT")
    private String sampleInput;
    @Column(columnDefinition = "LONGTEXT")
    private String sampleOutput;
    @Column(columnDefinition = "LONGTEXT")
    private String testCases; // Hidden test cases for evaluation
    @Column(columnDefinition = "LONGTEXT")
    private String constraints;
    @Column(columnDefinition = "LONGTEXT")
    private String hints;

    // Getters & Setters
    public String getQuestionId() {
        return questionId;
    }

    public void setQuestionId(String questionId) {
        this.questionId = questionId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }

    public Section getSection() {
        return section;
    }

    public void setSection(Section section) {
        this.section = section;
    }

    public Options getOptions() {
        return options;
    }

    public void setOptions(Options options) {
        this.options = options;
    }

    public double getMarks() {
        return marks;
    }

    public void setMarks(double marks) {
        this.marks = marks;
    }

    public double getNegativeMarks() {
        return negativeMarks;
    }

    public void setNegativeMarks(double negativeMarks) {
        this.negativeMarks = negativeMarks;
    }

    public Integer getTimeLimitSeconds() {
        return timeLimitSeconds;
    }

    public void setTimeLimitSeconds(Integer timeLimitSeconds) {
        this.timeLimitSeconds = timeLimitSeconds;
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
}
