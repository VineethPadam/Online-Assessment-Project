package com.example.OnlineAssessment.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.ElementCollection;
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

    @jakarta.persistence.ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
    private List<String> choices;

    @jakarta.persistence.ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
    @jakarta.persistence.Column(columnDefinition = "LONGTEXT")
    private List<String> choiceImages;

    private String correctOption;

    @OneToOne
    @JoinColumn(name = "question_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Questions question;

    // Getters & Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
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

    public Questions getQuestion() {
        return question;
    }

    public void setQuestion(Questions question) {
        this.question = question;
    }

    // backward compatibility helper if needed
    @JsonProperty("optionsArray")
    public List<String> getOptionsArray() {
        return choices;
    }
}
