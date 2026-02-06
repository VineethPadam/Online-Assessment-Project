package com.example.OnlineAssessment.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "departments", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "name", "college_id" })
})
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "college_id")
    private College college;

    @Column(nullable = false)
    private int years = 4; // Default to 4

    @Column(columnDefinition = "TEXT")
    private String sections; // JSON mapping: {"1": ["A", "B"], "2": ["A", "B", "C"]}

    public Department() {
    }

    public Department(String name, int years, String sections) {
        this.name = name;
        this.years = years;
        this.sections = sections;
    }

    // Getters & Setters
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

    public int getYears() {
        return years;
    }

    public void setYears(int years) {
        this.years = years;
    }

    public String getSections() {
        return sections;
    }

    public void setSections(String sections) {
        this.sections = sections;
    }

    public College getCollege() {
        return college;
    }

    public void setCollege(College college) {
        this.college = college;
    }
}
