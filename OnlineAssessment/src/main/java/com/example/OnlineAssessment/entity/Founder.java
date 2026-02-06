package com.example.OnlineAssessment.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
public class Founder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("id")
    private Long id;

    @JsonProperty("name")
    private String name;

    @JsonProperty("title")
    private String title;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("intro")
    private String intro;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("background")
    private String background;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("experience")
    private String experience;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("vision")
    private String vision;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("message")
    private String message;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    @JsonProperty("imageUrl")
    private String imageUrl;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getIntro() {
        return intro;
    }

    public void setIntro(String intro) {
        this.intro = intro;
    }

    public String getBackground() {
        return background;
    }

    public void setBackground(String background) {
        this.background = background;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getVision() {
        return vision;
    }

    public void setVision(String vision) {
        this.vision = vision;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}
