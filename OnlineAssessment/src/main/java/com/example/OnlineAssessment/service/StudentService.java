package com.example.OnlineAssessment.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.repositories.studentRepo;

@Service
public class StudentService {

    @Autowired
    private studentRepo studentRepo;

    // Case-sensitive login validation
    public Student validateStudent(String rollNumber, String password) {
        Student student = studentRepo.findById(rollNumber).orElse(null);
        if (student != null && student.getPassword().equals(password)) {
            return student; // exact match
        }
        return null;
    }

    public Student saveStudent(Student student) {
        return studentRepo.save(student);
    }

    public Student getByRollNumber(String rollNumber) {
        return studentRepo.findById(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found with roll number: " + rollNumber));
    }

    public java.util.List<Student> getAllStudents() {
        return studentRepo.findAll();
    }

    public java.util.List<Student> getFilteredStudents(String dept, String sec, Integer year) {
        if (dept != null && !dept.isEmpty()) {
            if (sec != null && !sec.isEmpty()) {
                if (year != null)
                    return studentRepo.findByDepartmentAndStudentSectionAndStudentYear(dept, sec, year);
                return studentRepo.findByDepartmentAndStudentSection(dept, sec);
            }
            if (year != null)
                return studentRepo.findByDepartmentAndStudentYear(dept, year);
            return studentRepo.findByDepartment(dept);
        }
        if (sec != null && !sec.isEmpty()) {
            if (year != null)
                return studentRepo.findByStudentSectionAndStudentYear(sec, year);
            return studentRepo.findByStudentSection(sec);
        }
        if (year != null)
            return studentRepo.findByStudentYear(year);
        return studentRepo.findAll();
    }

    public void deleteStudent(String rollNumber) {
        studentRepo.deleteById(rollNumber);
    }

    public Student updateStudent(String rollNumber, Student studentDetails) {
        Student student = getByRollNumber(rollNumber);
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
