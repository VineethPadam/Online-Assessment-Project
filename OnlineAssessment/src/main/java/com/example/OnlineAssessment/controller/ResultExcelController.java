package com.example.OnlineAssessment.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.service.ResultExcelService;

@RestController
@RequestMapping("/results")
@CrossOrigin(origins = "*")
public class ResultExcelController {

    @Autowired
    private ResultExcelService resultExcelService;

    /**
     * Download class results Excel with optional filters:
     * /results/download?section=A&department=CSE&year=3&quizId=23-JAVA-ASS-1
     */
    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadClassResults(
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String quizId) {
        try {
            byte[] excelData = resultExcelService.generateClassResultsExcel(section, department, year, quizId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=class_results.xlsx");
            headers.setContentLength(excelData.length);

            return new ResponseEntity<>(excelData, headers, HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
