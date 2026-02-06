package com.example.OnlineAssessment.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.service.StudentService;
import com.example.OnlineAssessment.service.StudentExcelService;
import com.example.OnlineAssessment.security.JwtUtil;
import com.example.OnlineAssessment.entity.College;
import com.example.OnlineAssessment.repositories.CollegeRepo;

@RestController
@RequestMapping("/admin/students")
@CrossOrigin(origins = "*")
public class AdminStudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private StudentExcelService studentExcelService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CollegeRepo collegeRepo;

    @GetMapping
    public ResponseEntity<List<Student>> getStudents(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String rollNumber) {

        String token = authHeader.substring(7);
        Long collegeId = jwtUtil.extractCollegeId(token);

        List<Student> students = studentService.getFilteredStudents(department, section, year, rollNumber, collegeId);
        return ResponseEntity.ok(students);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addStudent(@RequestHeader("Authorization") String authHeader,
            @RequestBody Student student) {
        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);
            if (collegeId != null) {
                College college = collegeRepo.findById(collegeId).orElse(null);
                student.setCollege(college);
            }
            Student saved = studentService.saveStudent(student);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{rollNumber}")
    public ResponseEntity<?> updateStudent(@RequestHeader("Authorization") String authHeader,
            @PathVariable String rollNumber, @RequestBody Student studentDetails) {
        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);
            Student updated = studentService.updateStudent(rollNumber, studentDetails, collegeId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{rollNumber}")
    public ResponseEntity<?> deleteStudent(@RequestHeader("Authorization") String authHeader,
            @PathVariable String rollNumber) {
        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);
            studentService.deleteStudent(rollNumber, collegeId);
            return ResponseEntity.ok("Student deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadStudents(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String rollNumber) {
        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);

            List<Student> students = studentService.getFilteredStudents(department, section, year, rollNumber,
                    collegeId);
            byte[] excelData = studentExcelService.generateStudentExcel(students);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students.xlsx");
            headers.setContentLength(excelData.length);

            return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
