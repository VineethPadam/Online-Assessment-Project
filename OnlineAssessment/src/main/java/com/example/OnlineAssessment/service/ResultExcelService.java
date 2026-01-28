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
import org.springframework.transaction.annotation.Transactional;

import com.example.OnlineAssessment.entity.Result;

@Service
public class ResultExcelService {

    @Autowired
    private ResultService resultService;

    @Transactional(readOnly = true)
    public byte[] generateClassResultsExcel(
            Long quizId,
            String department,
            String section,
            Integer year) throws IOException {

        // Use the common robust filtering/ranking logic from ResultService
        List<Result> results = resultService.getRankedResults(quizId, department, section, year, "rank");

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Quiz Results");

        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Rank");
        headerRow.createCell(1).setCellValue("Roll Number");
        headerRow.createCell(2).setCellValue("Student Name");
        headerRow.createCell(3).setCellValue("Department");
        headerRow.createCell(4).setCellValue("Section");
        headerRow.createCell(5).setCellValue("Year");
        headerRow.createCell(6).setCellValue("Quiz Code");
        headerRow.createCell(7).setCellValue("Quiz Name");
        headerRow.createCell(8).setCellValue("Score");
        headerRow.createCell(9).setCellValue("Total Marks");
        headerRow.createCell(10).setCellValue("Pass/Fail");
        headerRow.createCell(11).setCellValue("Submission Time");

        int rowNum = 1;
        for (Result r : results) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(r.getRank() != null ? String.valueOf(r.getRank()) : "N/A");
            row.createCell(1).setCellValue(r.getStudent().getStudentRollNumber());
            row.createCell(2).setCellValue(r.getStudent().getStudentName());
            row.createCell(3).setCellValue(r.getStudent().getDepartment());
            row.createCell(4).setCellValue(r.getStudent().getStudentSection());
            row.createCell(5).setCellValue(r.getStudent().getStudentYear());
            row.createCell(6).setCellValue(r.getQuiz().getQuizCode());
            row.createCell(7).setCellValue(r.getQuiz().getQuizName());
            row.createCell(8).setCellValue(r.getScore());
            row.createCell(9).setCellValue(r.getTotalMarks());
            row.createCell(10).setCellValue(r.getPassFail());

            if (r.getSubmissionTime() != null) {
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter
                        .ofPattern("yyyy-MM-dd HH:mm:ss");
                row.createCell(11).setCellValue(r.getSubmissionTime().format(formatter));
            } else {
                row.createCell(11).setCellValue("N/A");
            }
        }

        // Auto-size columns for better readability
        for (int i = 0; i < 12; i++) {
            sheet.autoSizeColumn(i);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();

        return out.toByteArray();
    }
}
