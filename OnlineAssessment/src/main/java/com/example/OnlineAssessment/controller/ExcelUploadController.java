package com.example.OnlineAssessment.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.OnlineAssessment.service.StudentExcelService;
import com.example.OnlineAssessment.service.AdminExcelService;
import com.example.OnlineAssessment.service.QuestionExcelService;
import com.example.OnlineAssessment.security.JwtUtil;

@RestController
@RequestMapping("/upload")
@CrossOrigin(origins = "*")
public class ExcelUploadController {

    @Autowired
    private StudentExcelService studentExcelService;

    @Autowired
    private QuestionExcelService questionExcelService;

    @Autowired
    private AdminExcelService adminExcelService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/students")
    public ResponseEntity<String> uploadStudents(@RequestHeader("Authorization") String authHeader,
            @RequestParam("file") MultipartFile file) {
        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);
            studentExcelService.uploadStudents(file, collegeId);
            return ResponseEntity.ok("Students uploaded successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/questions")
    public ResponseEntity<String> uploadQuestions(@RequestHeader("Authorization") String authHeader,
            @RequestParam("file") MultipartFile file,
            @RequestParam("quizId") Long quizId) {

        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);
            questionExcelService.uploadQuestions(file, quizId, collegeId);
            return ResponseEntity.ok("Questions uploaded successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error");
        }
    }

    @PostMapping("/faculty")
    public ResponseEntity<String> uploadFaculty(@RequestHeader("Authorization") String authHeader,
            @RequestParam("file") MultipartFile file) {
        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);
            adminExcelService.uploadFaculty(file, collegeId);
            return ResponseEntity.ok("Faculty uploaded successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/faculty/download")
    public ResponseEntity<byte[]> downloadFacultyExcel() {
        try {
            byte[] excelData = adminExcelService.generateFacultyExcel();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=faculty.xlsx");
            headers.setContentLength(excelData.length);

            return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
}
