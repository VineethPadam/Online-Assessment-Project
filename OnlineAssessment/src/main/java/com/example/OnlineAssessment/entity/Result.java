package com.example.OnlineAssessment.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Transient;

@Entity
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private double score;

    private LocalDateTime submissionTime;

    @Transient
    private Integer rank;

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @ManyToOne
    @JoinColumn(name = "student_roll_number")
    private Student student;

    @Lob
    private String answers;

    @Lob
    private String scoreBreakdown; // JSON mapping questionId to marks awarded

    private double totalMarks;

    @Transient
    private String passFail;

    @Transient
    private boolean isPublished;

    @Transient
    private java.util.Map<String, String> studentAnswers;

    @Transient
    private java.util.Map<String, Double> scoreBreakdownMap;

    public double getTotalMarks() {
        return totalMarks;
    }

    public void setTotalMarks(double totalMarks) {
        this.totalMarks = totalMarks;
    }

    public String getPassFail() {
        return passFail;
    }

    public void setPassFail(String passFail) {
        this.passFail = passFail;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public LocalDateTime getSubmissionTime() {
        return submissionTime;
    }

    public void setSubmissionTime(LocalDateTime submissionTime) {
        this.submissionTime = submissionTime;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }

    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public String getAnswers() {
        return answers;
    }

    public void setAnswers(String answers) {
        this.answers = answers;
    }

    public boolean isPublished() {
        return isPublished;
    }

    public void setPublished(boolean isPublished) {
        this.isPublished = isPublished;
    }

    public java.util.Map<String, String> getStudentAnswers() {
        return studentAnswers;
    }

    public void setStudentAnswers(java.util.Map<String, String> studentAnswers) {
        this.studentAnswers = studentAnswers;
    }

    public String getScoreBreakdown() {
        return scoreBreakdown;
    }

    public void setScoreBreakdown(String scoreBreakdown) {
        this.scoreBreakdown = scoreBreakdown;
    }

    public java.util.Map<String, Double> getScoreBreakdownMap() {
        return scoreBreakdownMap;
    }

    public void setScoreBreakdownMap(java.util.Map<String, Double> scoreBreakdownMap) {
        this.scoreBreakdownMap = scoreBreakdownMap;
    }
}
