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
            String quizId,
            String department,
            String section,
            Integer year
    ) {

        if (quizId == null || quizId.isBlank()) {
            throw new RuntimeException("QuizId is required");
        }

        List<Result> results;

        boolean hasDept = department != null && !department.isBlank();
        boolean hasSec = section != null && !section.isBlank();
        boolean hasYear = year != null && year > 0;

        // ===== Fetch results =====
        if (!hasDept && !hasSec && !hasYear) {
            results = resultRepo.findRankedByQuiz(quizId);
        } else if (hasDept && !hasSec && !hasYear) {
            results = resultRepo.findRankedByQuizAndDepartment(quizId, department);
        } else if (hasDept && hasSec && hasYear) {
            results = resultRepo.findRankedByQuizDepartmentSectionYear(
                    quizId, department, section, year
            );
        } else if (hasDept && hasYear) {
            results = resultRepo.findRankedByQuizDepartmentYear(
                    quizId, department, year
            );
        } else if (hasDept && hasSec) {
            results = resultRepo.findRankedByQuizDepartmentSection(
                    quizId, department, section
            );
        } else {
            results = Collections.emptyList();
        }

        // ===== Prepare response (ALL departments) =====
        Map<String, Map<String, Object>> analysis = new LinkedHashMap<>();

        departmentService.getAllDepartments().forEach(dep -> {
            Map<String, Object> map = new HashMap<>();
            map.put("Pass", 0);
            map.put("Fail", 0);
            map.put("status", "NO_ATTEMPT");
            analysis.put(dep.getName().trim().toUpperCase(), map);
        });

        // ===== Count Pass / Fail =====
        for (Result r : results) {

            if (r.getStudent() == null || r.getStudent().getDepartment() == null) {
                continue;
            }

            String dept = r.getStudent().getDepartment().trim().toUpperCase();
            Map<String, Object> map = analysis.get(dept);

            if (map == null) continue;

            String result = r.getPassFail();

            if ("Pass".equalsIgnoreCase(result)) {
                map.put("Pass", (int) map.get("Pass") + 1);
                map.put("status", "AVAILABLE");
            } else if ("Fail".equalsIgnoreCase(result)) {
                map.put("Fail", (int) map.get("Fail") + 1);
                map.put("status", "AVAILABLE");
            }	
            // Ignore null / invalid values
        }

        return analysis;
    }
}
