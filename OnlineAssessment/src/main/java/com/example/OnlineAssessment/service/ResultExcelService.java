package com.example.OnlineAssessment.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.OnlineAssessment.entity.Result;
import com.example.OnlineAssessment.repositories.ResultRepo;

@Service
public class ResultExcelService {

    @Autowired
    private ResultRepo resultRepo;

    /**
     * Generate Excel for class results with optional filters.
     */
    public byte[] generateClassResultsExcel(String section, String department, String year, String quizId) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Class Results");

        // Header row
        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Roll Number");
        header.createCell(1).setCellValue("Student Name");
        header.createCell(2).setCellValue("Quiz ID");
        header.createCell(3).setCellValue("Score");

        // Fetch results using filter
        List<Result> results;
        if (section != null && department != null && year != null && quizId != null) {
            results = resultRepo.findResultsBySectionDepartmentYearAndQuiz(section, department, year, quizId);
        } else {
            results = resultRepo.findAll(); // No filter, all results
        }

        // Fill Excel rows
        int rowNum = 1;
        for (Result r : results) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(r.getStudent().getStudentRollNumber());
            row.createCell(1).setCellValue(r.getStudent().getStudentName());
            row.createCell(2).setCellValue(r.getQuiz().getQuizId());
            row.createCell(3).setCellValue(r.getScore());
        }

        // Write workbook to byte array
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();

        return out.toByteArray();
    }
}
