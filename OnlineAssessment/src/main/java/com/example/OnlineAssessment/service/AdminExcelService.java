package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.repositories.FacultyRepo;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AdminExcelService {

    private final FacultyRepo facultyRepo;

    public AdminExcelService(FacultyRepo facultyRepo) {
        this.facultyRepo = facultyRepo;
    }

    // Upload or Update Faculty Excel
    public void uploadFaculty(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);

            // Step 1: Collect all faculty IDs from Excel
            Set<String> excelFacultyIds = new HashSet<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                String facultyId = getCellValueAsString(row.getCell(0));
                String name = getCellValueAsString(row.getCell(1));
                String email = getCellValueAsString(row.getCell(2));
                String department = getCellValueAsString(row.getCell(3));
                // String password = getCellValueAsString(row.getCell(4));

                if (facultyId.isEmpty())
                    continue;

                excelFacultyIds.add(facultyId); // collect all IDs in Excel

                // Find existing faculty or create new
                Faculty faculty = facultyRepo.findById(facultyId).orElse(new Faculty());
                faculty.setFacultyId(facultyId);

                if (!name.isEmpty())
                    faculty.setFacultyName(name);
                if (!email.isEmpty())
                    faculty.setEmail(email);
                if (!department.isEmpty())
                    faculty.setDepartment(department);

                if (faculty.getPassword() == null) {
                    faculty.setPassword(facultyId);
                }

                facultyRepo.save(faculty);
            }

            // Step 2: Delete faculties that are not present in Excel
            List<Faculty> dbFaculties = facultyRepo.findAll();
            for (Faculty f : dbFaculties) {
                if (!excelFacultyIds.contains(f.getFacultyId())) {
                    facultyRepo.delete(f);
                }
            }
        }
    }

    // Generate Faculty Excel
    public byte[] generateFacultyExcel() throws Exception {
        return generateFacultyExcel(facultyRepo.findAll());
    }

    public byte[] generateFacultyExcel(List<Faculty> facultyList) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Faculty Data");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Faculty ID");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Email");
            header.createCell(3).setCellValue("Department");

            int rowNum = 1;
            for (Faculty f : facultyList) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(f.getFacultyId());
                row.createCell(1).setCellValue(f.getFacultyName());
                row.createCell(2).setCellValue(f.getEmail());
                row.createCell(3).setCellValue(f.getDepartment());
            }

            workbook.write(bos);
            return bos.toByteArray();
        }
    }

    // Helper method
    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }
}
