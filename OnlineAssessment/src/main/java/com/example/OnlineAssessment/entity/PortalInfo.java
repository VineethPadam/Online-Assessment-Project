package com.example.OnlineAssessment.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
public class PortalInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty("id")
    private Long id;

    // Hero Section
    @Column(columnDefinition = "TEXT")
    @JsonProperty("heroTitle")
    private String heroTitle;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("heroTagline")
    private String heroTagline;

    // About Us
    @Column(columnDefinition = "TEXT")
    @JsonProperty("aboutTitle")
    private String aboutTitle;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("aboutDescription")
    private String aboutDescription;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("aboutStory")
    private String aboutStory;

    // Vision & Mission
    @Column(columnDefinition = "TEXT")
    @JsonProperty("vision")
    private String vision;

    @Column(columnDefinition = "TEXT")
    @JsonProperty("mission")
    private String mission;

    // Contact
    @JsonProperty("contactEmail")
    private String contactEmail;

    @JsonProperty("contactPhone")
    private String contactPhone;

    // Dynamic List Content (Stored as JSON Strings)
    @Column(columnDefinition = "TEXT")
    @JsonProperty("whatWeOffer")
    private String whatWeOffer; // JSON for "What We Offer" cards

    @Column(columnDefinition = "TEXT")
    @JsonProperty("whyChoose")
    private String whyChoose; // JSON for "Why Choose Our Portal"

    @Column(columnDefinition = "TEXT")
    @JsonProperty("features")
    private String features; // JSON for "Features" section

    @Column(columnDefinition = "TEXT")
    @JsonProperty("howItWorks")
    private String howItWorks; // JSON for "How It Works"

    @Column(columnDefinition = "TEXT")
    @JsonProperty("examTypes")
    private String examTypes; // JSON for "Exam Types"

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getHeroTitle() {
        return heroTitle;
    }

    public void setHeroTitle(String heroTitle) {
        this.heroTitle = heroTitle;
    }

    public String getHeroTagline() {
        return heroTagline;
    }

    public void setHeroTagline(String heroTagline) {
        this.heroTagline = heroTagline;
    }

    public String getAboutTitle() {
        return aboutTitle;
    }

    public void setAboutTitle(String aboutTitle) {
        this.aboutTitle = aboutTitle;
    }

    public String getAboutDescription() {
        return aboutDescription;
    }

    public void setAboutDescription(String aboutDescription) {
        this.aboutDescription = aboutDescription;
    }

    public String getAboutStory() {
        return aboutStory;
    }

    public void setAboutStory(String aboutStory) {
        this.aboutStory = aboutStory;
    }

    public String getVision() {
        return vision;
    }

    public void setVision(String vision) {
        this.vision = vision;
    }

    public String getMission() {
        return mission;
    }

    public void setMission(String mission) {
        this.mission = mission;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getWhatWeOffer() {
        return whatWeOffer;
    }

    public void setWhatWeOffer(String whatWeOffer) {
        this.whatWeOffer = whatWeOffer;
    }

    public String getWhyChoose() {
        return whyChoose;
    }

    public void setWhyChoose(String whyChoose) {
        this.whyChoose = whyChoose;
    }

    public String getFeatures() {
        return features;
    }

    public void setFeatures(String features) {
        this.features = features;
    }

    public String getHowItWorks() {
        return howItWorks;
    }

    public void setHowItWorks(String howItWorks) {
        this.howItWorks = howItWorks;
    }

    public String getExamTypes() {
        return examTypes;
    }

    public void setExamTypes(String examTypes) {
        this.examTypes = examTypes;
    }
}
