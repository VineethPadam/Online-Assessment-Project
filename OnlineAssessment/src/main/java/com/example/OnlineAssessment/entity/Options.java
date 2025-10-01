package com.example.OnlineAssessment.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

import java.util.Arrays;
import java.util.List;

@Entity
public class Options {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String option1;
    private String option2;
    private String option3;
    private String option4;
    private String correctOption;

    @OneToOne
    @JoinColumn(name = "question_id")
    @JsonBackReference
    private Questions question;

    // --- Helper to return options as a list for frontend ---
    @JsonProperty("optionsArray")
    public List<String> getOptionsArray() {
        return Arrays.asList(option1, option2, option3, option4);
    }

    // Getters & Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getOption1() { return option1; }
    public void setOption1(String option1) { this.option1 = option1; }

    public String getOption2() { return option2; }
    public void setOption2(String option2) { this.option2 = option2; }

    public String getOption3() { return option3; }
    public void setOption3(String option3) { this.option3 = option3; }

    public String getOption4() { return option4; }
    public void setOption4(String option4) { this.option4 = option4; }

    public String getCorrectOption() { return correctOption; }
    public void setCorrectOption(String correctOption) { this.correctOption = correctOption; }

    public Questions getQuestion() { return question; }
    public void setQuestion(Questions question) { this.question = question; }
}
