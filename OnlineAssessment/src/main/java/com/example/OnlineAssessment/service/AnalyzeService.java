package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.Result;
import com.example.OnlineAssessment.repositories.ResultRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class AnalyzeService {

    private final ResultRepo resultRepo;
    private final DepartmentService departmentService;

    public AnalyzeService(ResultRepo resultRepo,
            DepartmentService departmentService) {
        this.resultRepo = resultRepo;
        this.departmentService = departmentService;
    }

    public Map<String, Map<String, Object>> getPassFailAnalysis(
            Long quizId,
            String department,
            String section,
            Integer year,
            Long collegeId) {

        if (quizId == null) {
            throw new RuntimeException("QuizId is required");
        }

        List<Result> results;

        boolean hasDept = department != null && !department.isBlank();
        boolean hasSec = section != null && !section.isBlank();

        if (year != null && year > 0) {
            int y = year.intValue();
            if (hasDept && hasSec) {
                results = resultRepo.findRankedByQuizDepartmentSectionYear(
                        quizId, department, section, y, collegeId);
            } else if (hasDept) {
                results = resultRepo.findRankedByQuizDepartmentYear(
                        quizId, department, y, collegeId);
            } else {
                results = Collections.emptyList();
            }
        } else if (hasDept) {
            if (hasSec) {
                results = resultRepo.findRankedByQuizDepartmentSection(
                        quizId, department, section, collegeId);
            } else {
                results = resultRepo.findRankedByQuizAndDepartment(quizId, department, collegeId);
            }
        } else if (!hasDept && !hasSec) {
            results = resultRepo.findRankedByQuiz(quizId, collegeId);
        } else {
            results = Collections.emptyList();
        }

        Map<String, Map<String, Object>> analysis = new LinkedHashMap<>();

        departmentService.getAllDepartments().forEach(dep -> {
            Map<String, Object> map = new HashMap<>();
            map.put("Pass", 0);
            map.put("Fail", 0);
            map.put("status", "NO_ATTEMPT");
            analysis.put(dep.getName().trim().toUpperCase(), map);
        });

        for (Result r : results) {
            if (r.getStudent() == null || r.getStudent().getDepartment() == null) {
                continue;
            }

            String dept = r.getStudent().getDepartment().trim().toUpperCase();
            Map<String, Object> map = analysis.get(dept);

            if (map == null)
                continue;

            String resultStatus = r.getPassFail();

            if ("Pass".equalsIgnoreCase(resultStatus)) {
                map.put("Pass", (int) map.get("Pass") + 1);
                map.put("status", "AVAILABLE");
            } else if ("Fail".equalsIgnoreCase(resultStatus)) {
                map.put("Fail", (int) map.get("Fail") + 1);
                map.put("status", "AVAILABLE");
            }
        }

        return analysis;
    }
}
