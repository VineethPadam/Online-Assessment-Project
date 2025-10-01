package com.example.OnlineAssessment.entity;

import jakarta.persistence.*;

@Entity
public class QuizActivation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    private Quiz quiz; // Reference to Quiz

    private String section;     // Section for which quiz is active
    private String department;  // Department for which quiz is active
    private int year;           // Year for which quiz is active

    private boolean active = false; // Default inactive

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
}
