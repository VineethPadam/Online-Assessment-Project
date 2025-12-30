package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.repositories.FacultyRepo;
import com.example.OnlineAssessment.repositories.studentRepo;
import com.example.OnlineAssessment.service.OtpService;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/password")
@CrossOrigin(origins = "*")
public class PasswordController {

    private final OtpService otpService;
    private final studentRepo studentRepo;
    private final FacultyRepo facultyRepo;

    public PasswordController(OtpService otpService,
                              studentRepo studentRepo,
                              FacultyRepo facultyRepo) {
        this.otpService = otpService;
        this.studentRepo = studentRepo;
        this.facultyRepo = facultyRepo;
    }

    /* ===================== FACULTY ===================== */

    @PostMapping("/faculty/send-otp")
    public ResponseEntity<?> sendFacultyOtp(@RequestParam String email) {
        Faculty faculty = facultyRepo.findByEmail(email);
        if (faculty == null) {
            return ResponseEntity.badRequest().body("Faculty email not found");
        }

        otpService.generateAndSendOtp(email);
        return ResponseEntity.ok("OTP sent to faculty email");
    }

    @PostMapping("/faculty/reset")
    public ResponseEntity<?> resetFacultyPassword(
            @RequestParam String email,
            @RequestParam String otp,
            @RequestParam String newPassword) {

        if (!otpService.verifyOtp(email, otp)) {
            return ResponseEntity.badRequest().body("Invalid or expired OTP");
        }

        Faculty faculty = facultyRepo.findByEmail(email);
        if (faculty == null) return ResponseEntity.badRequest().body("Faculty not found");

        faculty.setPassword(newPassword); // plain password
        facultyRepo.save(faculty);

        return ResponseEntity.ok("Faculty password updated");
    }

    /* ===================== STUDENT ===================== */

    @PostMapping("/student/send-otp")
    public ResponseEntity<?> sendStudentOtp(@RequestParam String roll) {
        Optional<Student> studentOpt = studentRepo.findByStudentRollNumber(roll);
        if (studentOpt.isEmpty()) return ResponseEntity.badRequest().body("Student not found");

        otpService.generateAndSendOtp(studentOpt.get().getStudentEmail());
        return ResponseEntity.ok("OTP sent to student email");
    }

    @PostMapping("/student/reset")
    public ResponseEntity<?> resetStudentPassword(
            @RequestParam String roll,
            @RequestParam String otp,
            @RequestParam String newPassword) {

        Optional<Student> studentOpt = studentRepo.findByStudentRollNumber(roll);
        if (studentOpt.isEmpty()) return ResponseEntity.badRequest().body("Student not found");

        Student student = studentOpt.get();

        if (!otpService.verifyOtp(student.getStudentEmail(), otp)) {
            return ResponseEntity.badRequest().body("Invalid or expired OTP");
        }

        student.setPassword(newPassword); // plain password
        studentRepo.save(student);

        return ResponseEntity.ok("Student password updated");
    }
}
