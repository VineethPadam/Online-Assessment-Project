package com.example.OnlineAssessment.entity;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Quiz {

    @Id
    private String quizId;
    private String quizName;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    @JsonBackReference
    private List<Questions> questions; // Questions associated with the quiz

    // Optional: can map QuizActivation if needed
    // @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL)
    // private List<QuizActivation> activations;

    // Getters & Setters
    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }

    public String getQuizName() { return quizName; }
    public void setQuizName(String quizName) { this.quizName = quizName; }

    public List<Questions> getQuestions() { return questions; }
    public void setQuestions(List<Questions> questions) { this.questions = questions; }
}
