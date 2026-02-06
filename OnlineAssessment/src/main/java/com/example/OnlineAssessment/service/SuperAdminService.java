package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.College;
import com.example.OnlineAssessment.entity.QuestionBank;
import com.example.OnlineAssessment.repositories.CollegeRepo;
import com.example.OnlineAssessment.repositories.QuestionBankRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SuperAdminService {

    @Autowired
    private CollegeRepo collegeRepo;

    @Autowired
    private com.example.OnlineAssessment.repositories.AdminRepo adminRepo;

    @Autowired
    private QuestionBankRepo questionBankRepo;

    // College Management
    public College addCollege(College college) {
        if (college.getCollegeName() == null || college.getCollegeName().trim().isEmpty()) {
            throw new IllegalArgumentException("College Name is required");
        }
        // Duplicate checks with Security themed messages
        if (collegeRepo.existsByCollegeName(college.getCollegeName().trim())) {
            throw new RuntimeException("Security problem: A college with this name already exists.");
        }
        if (college.getContactEmail() != null && collegeRepo.existsByContactEmail(college.getContactEmail().trim())) {
            throw new RuntimeException("Security problem: This email is already registered to another institution.");
        }
        if (college.getAccessCode() != null && !college.getAccessCode().isEmpty()
                && collegeRepo.existsByAccessCode(college.getAccessCode().trim())) {
            throw new RuntimeException("Security problem: This college code is already in use.");
        }
        if (college.getAdminUsername() != null && adminRepo.existsById(college.getAdminUsername().trim())) {
            throw new RuntimeException("Security problem: This admin username is already taken.");
        }
        if (college.getAdminPassword() != null && adminRepo.existsByPassword(college.getAdminPassword().trim())) {
            throw new RuntimeException("Security problem: Using already existing password for another admin account.");
        }

        if (college.getAccessCode() == null || college.getAccessCode().isEmpty()) {
            college.setAccessCode(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        College savedCollege = collegeRepo.save(college);

        // If admin credentials are provided, create the Admin record
        if (college.getAdminUsername() != null && !college.getAdminUsername().trim().isEmpty() &&
                college.getAdminPassword() != null && !college.getAdminPassword().trim().isEmpty()) {

            com.example.OnlineAssessment.entity.Admin admin = new com.example.OnlineAssessment.entity.Admin();
            admin.setUsername(college.getAdminUsername().trim());
            admin.setPassword(college.getAdminPassword().trim());
            admin.setCollege(savedCollege);
            adminRepo.save(admin);
        }

        return savedCollege;
    }

    public List<College> getAllColleges() {
        return collegeRepo.findAll();
    }

    public void toggleCollegeStatus(Long id) {
        College college = collegeRepo.findById(id).orElseThrow(() -> new RuntimeException("College not found"));
        college.setActive(!college.isActive());
        collegeRepo.save(college);
    }

    public College getCollegeById(Long id) {
        College college = collegeRepo.findById(id).orElseThrow(() -> new RuntimeException("College not found"));
        // Try to find the associated admin to populate transient fields for editing
        adminRepo.findAll().stream()
                .filter(a -> a.getCollege() != null && a.getCollege().getId().equals(id))
                .findFirst()
                .ifPresent(admin -> {
                    college.setAdminUsername(admin.getUsername());
                    college.setAdminPassword(admin.getPassword());
                });
        return college;
    }

    public College updateCollege(Long id, College details) {
        College college = collegeRepo.findById(id).orElseThrow(() -> new RuntimeException("College not found"));
        college.setCollegeName(details.getCollegeName());
        college.setContactEmail(details.getContactEmail());
        college.setContactPhone(details.getContactPhone());
        college.setAddress(details.getAddress());
        // Note: accessCode is usually immutable as it's a license key of sorts
        return collegeRepo.save(college);
    }

    public void deleteCollege(Long id) {
        if (id != null) {
            collegeRepo.deleteById(id);
        }
    }

    // Question Bank Management
    public QuestionBank addQuestionToBank(QuestionBank q) {
        if (q == null)
            throw new IllegalArgumentException("Question cannot be null");
        return questionBankRepo.save(q);
    }

    public void deleteQuestionFromBank(String id) {
        if (id != null) {
            questionBankRepo.deleteById(id);
        }
    }

    public QuestionBank getQuestionFromBank(String id) {
        return questionBankRepo.findById(id).orElseThrow(() -> new RuntimeException("Question not found"));
    }

    public QuestionBank updateQuestionInBank(String id, QuestionBank details) {
        QuestionBank existing = questionBankRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));
        existing.setQuestionText(details.getQuestionText());
        existing.setQuestionType(details.getQuestionType());
        existing.setCategory(details.getCategory());
        existing.setTopic(details.getTopic());
        existing.setDifficulty(details.getDifficulty());
        existing.setCompanies(details.getCompanies());
        existing.setQuestionImage(details.getQuestionImage());
        existing.setChoices(details.getChoices());
        existing.setChoiceImages(details.getChoiceImages());
        existing.setCorrectOption(details.getCorrectOption());
        existing.setInputFormat(details.getInputFormat());
        existing.setOutputFormat(details.getOutputFormat());
        existing.setConstraints(details.getConstraints());
        existing.setSampleInput(details.getSampleInput());
        existing.setSampleOutput(details.getSampleOutput());
        existing.setTestCases(details.getTestCases());
        return questionBankRepo.save(existing);
    }

    // Company Management
    @Autowired
    private com.example.OnlineAssessment.repositories.CompanyRepo companyRepo;

    public com.example.OnlineAssessment.entity.Company addCompany(com.example.OnlineAssessment.entity.Company company) {
        if (company == null)
            throw new IllegalArgumentException("Company cannot be null");
        return companyRepo.save(company);
    }

    public List<com.example.OnlineAssessment.entity.Company> getAllCompanies() {
        return companyRepo.findAll();
    }

    public void deleteCompany(Long id) {
        companyRepo.deleteById(id);
    }
}
