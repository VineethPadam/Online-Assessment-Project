package com.example.OnlineAssessment.entity;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Faculty {

    @Id
    private String facultyId;
    private String facultyName;
    private String email;
    private String department;
    private String password;  // optional if login requires password

    @OneToMany
    @JsonIgnore
    private List<Quiz> quizzes;  // faculty quizzes

    // Getters & Setters
    public String getFacultyId() { return facultyId; }
    public void setFacultyId(String facultyId) { this.facultyId = facultyId; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public List<Quiz> getQuizzes() { return quizzes; }
    public void setQuizzes(List<Quiz> quizzes) { this.quizzes = quizzes; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
