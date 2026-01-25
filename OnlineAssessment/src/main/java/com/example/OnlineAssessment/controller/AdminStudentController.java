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

@RestController
@RequestMapping("/admin/students")
@CrossOrigin(origins = "*")
public class AdminStudentController {

    @Autowired
    private StudentService studentService;

    @Autowired
    private StudentExcelService studentExcelService;

    @GetMapping
    public ResponseEntity<List<Student>> getStudents(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Integer year) {

        List<Student> students = studentService.getFilteredStudents(department, section, year);
        return ResponseEntity.ok(students);
    }

    @PutMapping("/{rollNumber}")
    public ResponseEntity<?> updateStudent(@PathVariable String rollNumber, @RequestBody Student studentDetails) {
        try {
            Student updated = studentService.updateStudent(rollNumber, studentDetails);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{rollNumber}")
    public ResponseEntity<?> deleteStudent(@PathVariable String rollNumber) {
        try {
            studentService.deleteStudent(rollNumber);
            return ResponseEntity.ok("Student deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadStudents(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Integer year) {
        try {
            List<Student> students = studentService.getFilteredStudents(department, section, year);
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
