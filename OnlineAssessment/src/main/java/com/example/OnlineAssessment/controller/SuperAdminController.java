package com.example.OnlineAssessment.controller;

import com.example.OnlineAssessment.entity.College;
import com.example.OnlineAssessment.entity.QuestionBank;
import com.example.OnlineAssessment.entity.PortalInfo;
import com.example.OnlineAssessment.entity.SuperAdminProfile;
import com.example.OnlineAssessment.entity.ContactMessage;
import com.example.OnlineAssessment.service.SuperAdminService;
import com.example.OnlineAssessment.service.SuperAdminContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/superadmin")
public class SuperAdminController {

    @Autowired
    private SuperAdminService superAdminService;

    // --- College Management ---
    @PostMapping("/colleges")
    public ResponseEntity<College> addCollege(@RequestBody College college) {
        return ResponseEntity.ok(superAdminService.addCollege(college));
    }

    @GetMapping("/colleges")
    public List<College> getColleges() {
        return superAdminService.getAllColleges();
    }

    @GetMapping("/colleges/{id}")
    public ResponseEntity<College> getCollege(@PathVariable Long id) {
        return ResponseEntity.ok(superAdminService.getCollegeById(id));
    }

    @PutMapping("/colleges/{id}")
    public ResponseEntity<College> updateCollege(@PathVariable Long id, @RequestBody College college) {
        return ResponseEntity.ok(superAdminService.updateCollege(id, college));
    }

    @PutMapping("/colleges/{id}/toggle-status")
    public ResponseEntity<?> toggleCollegeStatus(@PathVariable Long id) {
        superAdminService.toggleCollegeStatus(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/colleges/{id}")
    public ResponseEntity<?> deleteCollege(@PathVariable Long id) {
        superAdminService.deleteCollege(id);
        return ResponseEntity.ok().build();
    }

    // --- Question Bank Management ---
    @PostMapping("/questions")
    public ResponseEntity<QuestionBank> addDirectQuestion(@RequestBody QuestionBank q) {
        return ResponseEntity.ok(superAdminService.addQuestionToBank(q));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable String id) {
        superAdminService.deleteQuestionFromBank(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<QuestionBank> getQuestion(@PathVariable String id) {
        return ResponseEntity.ok(superAdminService.getQuestionFromBank(id));
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<QuestionBank> updateQuestion(@PathVariable String id, @RequestBody QuestionBank q) {
        return ResponseEntity.ok(superAdminService.updateQuestionInBank(id, q));
    }

    // --- Company Management ---
    @PostMapping("/companies/add")
    public ResponseEntity<?> addCompany(@RequestBody com.example.OnlineAssessment.entity.Company company) {
        superAdminService.addCompany(company);
        return ResponseEntity.ok("Company Added");
    }

    @GetMapping("/companies")
    public List<com.example.OnlineAssessment.entity.Company> getCompanies() {
        return superAdminService.getAllCompanies();
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        superAdminService.deleteCompany(id);
        return ResponseEntity.ok().build();
    }

    // --- CMS Content Management ---
    @Autowired
    private SuperAdminContentService contentService;

    @GetMapping("/content/profile")
    public SuperAdminProfile getProfile() {
        return contentService.getProfile();
    }

    @PostMapping("/content/profile")
    public SuperAdminProfile saveProfile(@RequestBody SuperAdminProfile profile) {
        return contentService.saveProfile(profile);
    }

    // Contact Messages
    @GetMapping("/content/messages")
    public List<ContactMessage> getMessages() {
        return contentService.getAllMessages();
    }

    @DeleteMapping("/content/messages/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        contentService.deleteMessage(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/content/portal-info")
    public PortalInfo getPortalInfo() {
        return contentService.getPortalInfo();
    }

    @PostMapping("/content/portal-info")
    public PortalInfo savePortalInfo(@RequestBody PortalInfo info) {
        return contentService.savePortalInfo(info);
    }

    // --- Public CMS Endpoints ---
    @GetMapping("/public/portal-info")
    public PortalInfo getPublicPortalInfo() {
        return contentService.getPortalInfo();
    }

    @PostMapping("/public/contact")
    public ContactMessage submitContact(@RequestBody ContactMessage msg) {
        return contentService.saveMessage(msg);
    }
}
