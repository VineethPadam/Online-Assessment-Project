package com.example.OnlineAssessment.entity;

import jakarta.persistence.*;

@Entity
public class QuizActivation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    private String section;     
    private String department;  
    private int year;           

    private boolean active = false;     // quiz can be attempted
    private boolean published = false;  // results published for this batch

    // Getters & Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
}
