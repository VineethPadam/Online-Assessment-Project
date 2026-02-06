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
import com.example.OnlineAssessment.security.JwtUtil;
import com.example.OnlineAssessment.entity.College;
import com.example.OnlineAssessment.repositories.CollegeRepo;

@RestController
@RequestMapping("/admin/faculty")
@CrossOrigin(origins = "*")
public class AdminFacultyController {

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private AdminExcelService adminExcelService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CollegeRepo collegeRepo;

    @GetMapping
    public ResponseEntity<List<Faculty>> getFaculty(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String facultyId) {

        String token = authHeader.substring(7);
        Long collegeId = jwtUtil.extractCollegeId(token);

        List<Faculty> facultyList = facultyService.getFilteredFaculty(department, facultyId, collegeId);
        return ResponseEntity.ok(facultyList);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addFaculty(@RequestHeader("Authorization") String authHeader,
            @RequestBody Faculty faculty) {
        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);
            if (collegeId != null) {
                College college = collegeRepo.findById(collegeId).orElse(null);
                faculty.setCollege(college);
            }
            Faculty saved = facultyService.saveFaculty(faculty);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{facultyId}")
    public ResponseEntity<?> updateFaculty(@RequestHeader("Authorization") String authHeader,
            @PathVariable String facultyId, @RequestBody Faculty facultyDetails) {
        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);
            Faculty updated = facultyService.updateFaculty(facultyId, facultyDetails, collegeId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{facultyId}")
    public ResponseEntity<?> deleteFaculty(@RequestHeader("Authorization") String authHeader,
            @PathVariable String facultyId) {
        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);
            facultyService.deleteFaculty(facultyId, collegeId);
            return ResponseEntity.ok("Faculty deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadFaculty(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String facultyId) {
        try {
            String token = authHeader.substring(7);
            Long collegeId = jwtUtil.extractCollegeId(token);

            List<Faculty> facultyList = facultyService.getFilteredFaculty(department, facultyId, collegeId);
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
