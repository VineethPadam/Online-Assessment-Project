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
import com.example.OnlineAssessment.repositories.ResultRepo;

@Service
public class ResultExcelService {

    @Autowired
    private ResultRepo resultRepo;

    @Transactional(readOnly = true)
    public byte[] generateClassResultsExcel(
            String quizId,
            String department,
            String section,
            Integer year   // 🔴 MUST be Integer, not int
    ) throws IOException {

        List<Result> results;

        // ✅ ALL FILTER COMBINATIONS HANDLED
        if (quizId != null && department != null && section != null && year != null) {
            results = resultRepo.findRankedByQuizDepartmentSectionYear(
                    quizId, department, section, year);

        } else if (quizId != null && department != null && year != null) {
            results = resultRepo.findRankedByQuizDepartmentYear(
                    quizId, department, year);

        } else if (quizId != null && department != null && section != null) {
            results = resultRepo.findRankedByQuizDepartmentSection(
                    quizId, department, section);

        } else if (quizId != null && department != null) {
            results = resultRepo.findRankedByQuizAndDepartment(
                    quizId, department);

        } else {
            results = resultRepo.findRankedByQuiz(quizId);
        }

        // ✅ RANK + TOTAL MARKS + PASS/FAIL
        int rank = 1;
        for (int i = 0; i < results.size(); i++) {
            Result r = results.get(i);

            int totalMarks = r.getQuiz().getQuestions().size();
            r.setTotalMarks(totalMarks);

            String passFail =
                    ((double) r.getScore() / totalMarks) * 100 >= 40
                            ? "Pass" : "Fail";
            r.setPassFail(passFail);

            if (i > 0 &&
                    r.getScore() == results.get(i - 1).getScore()) {
                r.setRank(results.get(i - 1).getRank());
            } else {
                r.setRank(rank);
            }
            rank++;
        }

        results.sort((a, b) -> Integer.compare(a.getRank(), b.getRank()));

        // ✅ EXCEL CREATION
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Quiz Results");

        Row header = sheet.createRow(0);
        header.createCell(0).setCellValue("Rank");
        header.createCell(1).setCellValue("Roll Number");
        header.createCell(2).setCellValue("Student Name");
        header.createCell(3).setCellValue("Department");
        header.createCell(4).setCellValue("Section");
        header.createCell(5).setCellValue("Year");
        header.createCell(6).setCellValue("Quiz ID");
        header.createCell(7).setCellValue("Quiz Name");
        header.createCell(8).setCellValue("Score");
        header.createCell(9).setCellValue("Total Marks");
        header.createCell(10).setCellValue("Pass/Fail");
        header.createCell(11).setCellValue("Submission Time");

        int rowNum = 1;
        for (Result r : results) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(r.getRank());
            row.createCell(1).setCellValue(r.getStudent().getStudentRollNumber());
            row.createCell(2).setCellValue(r.getStudent().getStudentName());
            row.createCell(3).setCellValue(r.getStudent().getDepartment());
            row.createCell(4).setCellValue(r.getStudent().getStudentSection());
            row.createCell(5).setCellValue(r.getStudent().getStudentYear());
            row.createCell(6).setCellValue(r.getQuiz().getQuizId());
            row.createCell(7).setCellValue(r.getQuiz().getQuizName());
            row.createCell(8).setCellValue(r.getScore());
            row.createCell(9).setCellValue(r.getTotalMarks());
            row.createCell(10).setCellValue(r.getPassFail());
            row.createCell(11).setCellValue(r.getSubmissionTime().toString());
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();

        return out.toByteArray();
    }
}
