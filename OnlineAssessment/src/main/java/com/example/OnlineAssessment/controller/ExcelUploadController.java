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

    // ------------------ Upload Endpoints ------------------

    @PostMapping("/students")
    public ResponseEntity<String> uploadStudents(@RequestParam("file") MultipartFile file){
        try{
            studentExcelService.uploadStudents(file);
            return ResponseEntity.ok("Students uploaded successfully");
        } catch(Exception e){
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/questions")
    public ResponseEntity<String> uploadQuestions(@RequestParam("file") MultipartFile file,
                                                  @RequestParam("quizName") String quizName,
                                                  @RequestParam("quizId") String quizId){
        try{
            questionExcelService.uploadQuestions(file, quizName, quizId);
            return ResponseEntity.ok("Questions and Options uploaded successfully");
        } catch(Exception e){
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Error: " + e.getMessage());
        }
    }

    /*@PostMapping("/admins")
    public ResponseEntity<String> uploadAdmins(@RequestParam("file") MultipartFile file){
        try{
            adminExcelService.uploadAdmins(file);
            return ResponseEntity.ok("Admins uploaded successfully");
        } catch(Exception e){
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Error: " + e.getMessage());
        }
    }*/

    @PostMapping("/faculty")
    public ResponseEntity<String> uploadFaculty(@RequestParam("file") MultipartFile file){
        try{
            adminExcelService.uploadFaculty(file);
            return ResponseEntity.ok("Faculty uploaded successfully");
        } catch(Exception e){
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Error: " + e.getMessage());
        }
    }

    // ------------------ Download Faculty Excel ------------------

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
