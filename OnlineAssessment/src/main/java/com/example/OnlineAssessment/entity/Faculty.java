package com.example.OnlineAssessment.entity;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Faculty {

    @Id
    private String facultyId;
    private String facultyName;
    private String email;
    private String department;

    // Getters & Setters
    public String getFacultyId() { return facultyId; }
    public void setFacultyId(String facultyId) { this.facultyId = facultyId; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
