	package com.example.OnlineAssessment.entity;
	
	import jakarta.persistence.Entity;
	import jakarta.persistence.Id;
	import jakarta.persistence.Table;
	
	@Entity
	@Table(name = "student")
	public class Student {
	
	    @Id
	    private String studentRollNumber;
	
	    private String studentName;
	    private String studentSection;
	    private int studentYear;
	    private String department;
	    private String studentEmail;
	    private String password;
	
	    // Getters & Setters
	    public String getStudentRollNumber() { return studentRollNumber; }
	    public void setStudentRollNumber(String studentRollNumber) { this.studentRollNumber = studentRollNumber; }
	
	    public String getStudentName() { return studentName; }
	    public void setStudentName(String studentName) { this.studentName = studentName; }
	
	    public String getStudentSection() { return studentSection; }
	    public void setStudentSection(String studentSection) { this.studentSection = studentSection; }
	
	    public int getStudentYear() { return studentYear; }
	    public void setStudentYear(int studentYear) { this.studentYear = studentYear; }
	
	    public String getDepartment() { return department; }
	    public void setDepartment(String department) { this.department = department; }
	
	    public String getStudentEmail() { return studentEmail; }
	    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
	
	    public String getPassword() { return password; }
	    public void setPassword(String password) { this.password = password; }
	}
