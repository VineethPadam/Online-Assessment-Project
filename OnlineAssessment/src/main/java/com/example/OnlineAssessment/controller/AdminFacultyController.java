package com.example.OnlineAssessment.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.OnlineAssessment.entity.Faculty;
import com.example.OnlineAssessment.service.FacultyService;
import com.example.OnlineAssessment.service.AdminExcelService;

@RestController
@RequestMapping("/admin/faculty")
@CrossOrigin(origins = "*")
public class AdminFacultyController {

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private AdminExcelService adminExcelService;

    @GetMapping
    public ResponseEntity<List<Faculty>> getFaculty(
            @RequestParam(required = false) String department) {

        List<Faculty> facultyList = facultyService.getFilteredFaculty(department);
        return ResponseEntity.ok(facultyList);
    }

    @PutMapping("/{facultyId}")
    public ResponseEntity<?> updateFaculty(@PathVariable String facultyId, @RequestBody Faculty facultyDetails) {
        try {
            Faculty updated = facultyService.updateFaculty(facultyId, facultyDetails);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{facultyId}")
    public ResponseEntity<?> deleteFaculty(@PathVariable String facultyId) {
        try {
            facultyService.deleteFaculty(facultyId);
            return ResponseEntity.ok("Faculty deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadFaculty(
            @RequestParam(required = false) String department) {
        try {
            List<Faculty> facultyList = facultyService.getFilteredFaculty(department);
            byte[] excelData = adminExcelService.generateFacultyExcel(facultyList);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=faculty.xlsx");
            headers.setContentLength(excelData.length);

            return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
