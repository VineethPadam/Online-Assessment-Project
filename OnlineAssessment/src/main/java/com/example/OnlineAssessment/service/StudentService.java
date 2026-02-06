package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.repositories.studentRepo;

@Service
public class StudentService {

    @Autowired
    private studentRepo studentRepo;

    // College-scoped login validation
    public Student validateStudent(String rollNumber, String password, Long collegeId) {
        Student student = studentRepo.findByStudentRollNumberAndCollegeId(rollNumber, collegeId).orElse(null);
        if (student != null && student.getPassword().equals(password)) {
            if (student.getCollege() != null && !student.getCollege().isActive()) {
                throw new RuntimeException("Your account has been deactivated. Please contact the Administrator.");
            }
            return student;
        }
        return null;
    }

    public Student saveStudent(Student student) {
        if (student == null)
            throw new IllegalArgumentException("Student cannot be null");
        return studentRepo.save(student);
    }

    public Student getByRollNumber(String rollNumber) {
        if (rollNumber == null)
            throw new IllegalArgumentException("Roll number cannot be null");
        return studentRepo.findById(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found with roll number: " + rollNumber));
    }

    public java.util.List<Student> getAllStudents() {
        return studentRepo.findAll();
    }

    public java.util.List<Student> getFilteredStudents(String dept, String sec, Integer year, String rollNumber,
            Long collegeId) {
        if (rollNumber != null && !rollNumber.trim().isEmpty()) {
            return studentRepo.findByStudentRollNumberAndCollegeId(rollNumber, collegeId)
                    .map(java.util.List::of)
                    .orElse(java.util.List.of());
        }
        if (dept != null && !dept.isEmpty()) {
            if (sec != null && !sec.isEmpty()) {
                if (year != null)
                    return studentRepo.findByDepartmentAndStudentSectionAndStudentYearAndCollegeId(dept, sec, year,
                            collegeId);
                return studentRepo.findByDepartmentAndStudentSectionAndCollegeId(dept, sec, collegeId);
            }
            if (year != null)
                return studentRepo.findByDepartmentAndStudentYearAndCollegeId(dept, year, collegeId);
            return studentRepo.findByDepartmentAndCollegeId(dept, collegeId);
        }
        if (sec != null && !sec.isEmpty()) {
            if (year != null)
                return studentRepo.findByStudentSectionAndStudentYearAndCollegeId(sec, year, collegeId);
            return studentRepo.findByStudentSectionAndCollegeId(sec, collegeId);
        }
        if (year != null)
            return studentRepo.findByStudentYearAndCollegeId(year, collegeId);

        return studentRepo.findByCollegeId(collegeId);
    }

    public void deleteStudent(String rollNumber, Long collegeId) {
        if (rollNumber != null) {
            Student student = studentRepo.findByStudentRollNumberAndCollegeId(rollNumber, collegeId)
                    .orElseThrow(() -> new RuntimeException("Student not found in this college"));
            studentRepo.delete(student);
        }
    }

    public Student updateStudent(String rollNumber, Student studentDetails, Long collegeId) {
        Student student = studentRepo.findByStudentRollNumberAndCollegeId(rollNumber, collegeId)
                .orElseThrow(() -> new RuntimeException("Student not found in this college"));
        student.setStudentName(studentDetails.getStudentName());
        student.setStudentEmail(studentDetails.getStudentEmail());
        student.setDepartment(studentDetails.getDepartment());
        student.setStudentSection(studentDetails.getStudentSection());
        student.setStudentYear(studentDetails.getStudentYear());
        if (studentDetails.getPassword() != null && !studentDetails.getPassword().trim().isEmpty()) {
            student.setPassword(studentDetails.getPassword());
        }
        return studentRepo.save(student);
    }
}
