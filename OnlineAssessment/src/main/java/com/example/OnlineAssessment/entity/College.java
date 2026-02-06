package com.example.OnlineAssessment.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class College {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String collegeName;

    @Column(unique = true, nullable = false)
    private String accessCode; // Used for registration or API keys

    private String address;
    private String contactEmail;
    private String contactPhone;

    private boolean isActive = true;
    private LocalDateTime createdAt = LocalDateTime.now();

    // Permission System - Question Types
    private boolean allowMcqQuestions = true;
    private boolean allowCodingQuestions = true;
    private boolean allowNumericQuestions = true;

    // Permission System - Features
    private boolean allowImageInQuestions = true;
    private boolean allowQuestionBankAccess = true;

    // User Limits
    private Integer maxFacultyUsers = 50; // Default 50 faculty
    private Integer maxStudentUsers = 1000; // Default 1000 students
    private Integer maxTotalUsers = 1050; // Default total (faculty + students + admins)

    @OneToMany(mappedBy = "college", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Admin> admins;

    @OneToMany(mappedBy = "college", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Faculty> faculty;

    @OneToMany(mappedBy = "college", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Student> students;

    @OneToMany(mappedBy = "college", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Department> departments;

    @Transient
    private String adminUsername;

    @Transient
    private String adminPassword;

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCollegeName() {
        return collegeName;
    }

    public void setCollegeName(String collegeName) {
        this.collegeName = collegeName;
    }

    public String getAccessCode() {
        return accessCode;
    }

    public void setAccessCode(String accessCode) {
        this.accessCode = accessCode;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
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

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getAdminUsername() {
        return adminUsername;
    }

    public void setAdminUsername(String adminUsername) {
        this.adminUsername = adminUsername;
    }

    public String getAdminPassword() {
        return adminPassword;
    }

    public void setAdminPassword(String adminPassword) {
        this.adminPassword = adminPassword;
    }

    // Permission System Getters and Setters
    public boolean isAllowMcqQuestions() {
        return allowMcqQuestions;
    }

    public void setAllowMcqQuestions(boolean allowMcqQuestions) {
        this.allowMcqQuestions = allowMcqQuestions;
    }

    public boolean isAllowCodingQuestions() {
        return allowCodingQuestions;
    }

    public void setAllowCodingQuestions(boolean allowCodingQuestions) {
        this.allowCodingQuestions = allowCodingQuestions;
    }

    public boolean isAllowNumericQuestions() {
        return allowNumericQuestions;
    }

    public void setAllowNumericQuestions(boolean allowNumericQuestions) {
        this.allowNumericQuestions = allowNumericQuestions;
    }

    public boolean isAllowImageInQuestions() {
        return allowImageInQuestions;
    }

    public void setAllowImageInQuestions(boolean allowImageInQuestions) {
        this.allowImageInQuestions = allowImageInQuestions;
    }

    public boolean isAllowQuestionBankAccess() {
        return allowQuestionBankAccess;
    }

    public void setAllowQuestionBankAccess(boolean allowQuestionBankAccess) {
        this.allowQuestionBankAccess = allowQuestionBankAccess;
    }

    public Integer getMaxFacultyUsers() {
        return maxFacultyUsers;
    }

    public void setMaxFacultyUsers(Integer maxFacultyUsers) {
        this.maxFacultyUsers = maxFacultyUsers;
    }

    public Integer getMaxStudentUsers() {
        return maxStudentUsers;
    }

    public void setMaxStudentUsers(Integer maxStudentUsers) {
        this.maxStudentUsers = maxStudentUsers;
    }

    public Integer getMaxTotalUsers() {
        return maxTotalUsers;
    }

    public void setMaxTotalUsers(Integer maxTotalUsers) {
        this.maxTotalUsers = maxTotalUsers;
    }
}
