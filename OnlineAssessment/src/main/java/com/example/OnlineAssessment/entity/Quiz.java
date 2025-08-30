package com.example.OnlineAssessment.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Quiz {
    
    @Id
    private int quizId;
    private String quizName;

    @ManyToOne
    @JoinColumn(name = "student_roll_number") // FK to Student
    private Student student;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    private List<Questions> questions;

    // Getters & Setters
    public int getQuizId() { return quizId; }
    public void setQuizId(int quizId) { this.quizId = quizId; }

    public String getQuizName() { return quizName; }
    public void setQuizName(String quizName) { this.quizName = quizName; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public List<Questions> getQuestions() { return questions; }
    public void setQuestions(List<Questions> questions) { this.questions = questions; }
}
