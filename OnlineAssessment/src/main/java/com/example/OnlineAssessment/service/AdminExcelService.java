package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.Admin;
import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.repositories.AdminRepo;
import com.example.OnlineAssessment.repositories.FacultyRepo;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;

@Service
public class AdminExcelService {

    private final AdminRepo adminRepo;
    private final FacultyRepo facultyRepo;

    public AdminExcelService(AdminRepo adminRepo, FacultyRepo facultyRepo) {
        this.adminRepo = adminRepo;
        this.facultyRepo = facultyRepo;
    }

    // Upload Admin Excel
    public void uploadAdmins(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String username = getCellValueAsString(row.getCell(0));
                String password = getCellValueAsString(row.getCell(1));

                if (username.isEmpty() || adminRepo.existsById(username)) continue;

                Admin admin = new Admin();
                admin.setUsername(username);
                admin.setPassword(password);
                adminRepo.save(admin);
            }
        }
    }

    // Upload Faculty Excel
    public void uploadFaculty(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String facultyId = getCellValueAsString(row.getCell(0));
                String name = getCellValueAsString(row.getCell(1));
                String email = getCellValueAsString(row.getCell(2));
                String department = getCellValueAsString(row.getCell(3));
                String password = getCellValueAsString(row.getCell(4));

                if (facultyId.isEmpty() || facultyRepo.existsById(facultyId)) continue;

                Faculty faculty = new Faculty();
                faculty.setFacultyId(facultyId);
                faculty.setFacultyName(name);
                faculty.setEmail(email);
                faculty.setDepartment(department);
                faculty.setPassword(password);
                facultyRepo.save(faculty);
            }
        }
    }

    // Generate Faculty Excel
    public byte[] generateFacultyExcel() throws Exception {
        List<Faculty> facultyList = facultyRepo.findAll();
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Faculty Data");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Faculty ID");
            header.createCell(1).setCellValue("Name");
            header.createCell(2).setCellValue("Email");
            header.createCell(3).setCellValue("Department");
            header.createCell(4).setCellValue("Password");

            int rowNum = 1;
            for (Faculty f : facultyList) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(f.getFacultyId());
                row.createCell(1).setCellValue(f.getFacultyName());
                row.createCell(2).setCellValue(f.getEmail());
                row.createCell(3).setCellValue(f.getDepartment());
                row.createCell(4).setCellValue(f.getPassword());
            }

            workbook.write(bos);
            return bos.toByteArray();
        }
    }

    // Helper method
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue().trim();
            case NUMERIC: return String.valueOf((long)cell.getNumericCellValue());
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            case FORMULA: return cell.getCellFormula();
            default: return "";
        }
    }
}
