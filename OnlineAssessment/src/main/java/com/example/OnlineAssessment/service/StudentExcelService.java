package com.example.OnlineAssessment.service;

import java.io.InputStream;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.example.OnlineAssessment.entity.Student;

@Service
public class StudentExcelService {

    @Autowired
    private StudentService studentService;

    public void uploadStudents(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream();
                Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter(); // Converts everything to string

            for (int i = 1; i <= sheet.getLastRowNum(); i++) { // skip header
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                String rollNo = formatter.formatCellValue(row.getCell(0)).trim();
                if (rollNo.isEmpty())
                    continue;

                Student s = new Student();
                s.setStudentRollNumber(rollNo);
                s.setStudentName(formatter.formatCellValue(row.getCell(1)).trim());
                s.setStudentSection(formatter.formatCellValue(row.getCell(2)).trim());
                s.setStudentYear(Integer.parseInt(formatter.formatCellValue(row.getCell(3)).trim()));
                s.setDepartment(formatter.formatCellValue(row.getCell(4)).trim());
                s.setStudentEmail(formatter.formatCellValue(row.getCell(5)).trim());
                s.setPassword("Reset@2025");

                studentService.saveStudent(s);
            }
        }
    }

    public byte[] generateStudentExcel(java.util.List<Student> students) throws Exception {
        try (Workbook workbook = new XSSFWorkbook();
                java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Students");
            Row header = sheet.createRow(0);
            String[] columns = { "Roll Number", "Name", "Section", "Year", "Department", "Email" };

            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i]);
            }

            int rowIdx = 1;
            for (Student s : students) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(s.getStudentRollNumber());
                row.createCell(1).setCellValue(s.getStudentName());
                row.createCell(2).setCellValue(s.getStudentSection());
                row.createCell(3).setCellValue(s.getStudentYear());
                row.createCell(4).setCellValue(s.getDepartment());
                row.createCell(5).setCellValue(s.getStudentEmail());
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}