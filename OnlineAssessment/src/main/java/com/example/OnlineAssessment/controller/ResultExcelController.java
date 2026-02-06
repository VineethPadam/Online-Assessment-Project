package com.example.OnlineAssessment.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.service.ResultExcelService;
import com.example.OnlineAssessment.security.JwtUtil;

@RestController
@RequestMapping("/results")
@CrossOrigin(origins = "*")
public class ResultExcelController {

    @Autowired
    private ResultExcelService resultExcelService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getCollegeId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractCollegeId(authHeader.substring(7));
        }
        return null;
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadClassResults(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) Long quizId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String year) {
        try {
            Integer yearInt = null;
            if (year != null && !year.isBlank()) {
                yearInt = Integer.parseInt(year);
            }

            Long collegeId = getCollegeId(authHeader);
            byte[] excelData = resultExcelService.generateClassResultsExcel(
                    quizId, department, section, yearInt, collegeId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=class_results.xlsx");
            headers.setContentLength(excelData.length);

            return new ResponseEntity<>(excelData, headers, HttpStatus.OK);

        } catch (NumberFormatException nfe) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
