package com.example.OnlineAssessment.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.OnlineAssessment.entity.Result;
import com.example.OnlineAssessment.service.ResultService;

@RestController
@RequestMapping("/result")
@CrossOrigin(origins = "*")
public class ResultController {

    @Autowired
    private ResultService resultService;

    @GetMapping("/section-department")
    public List<Result> getResultsBySectionAndDepartment(
            @RequestParam String section,
            @RequestParam String department,
            @RequestParam(required=false) Integer quizId){
        return resultService.getResultsBySectionAndDepartment(section, department, quizId);
    }

    @GetMapping("/student/{rollNumber}")
    public List<Result> getResultsByStudent(
            @PathVariable String rollNumber,
            @RequestParam(required=false) Integer quizId){
        return resultService.getResultsByStudentRollNumber(rollNumber, quizId);
    }

    @PostMapping("/save")
    public Result saveResult(@RequestBody Result result){
        return resultService.saveResult(result);
    }

    // ✅ New endpoint to check if student already attempted quiz
    @GetMapping("/attempted")
    public boolean isQuizAttempted(@RequestParam String rollNumber, @RequestParam int quizId){
        List<Result> results = resultService.getResultsByStudentRollNumber(rollNumber, quizId);
        return !results.isEmpty();
    }
}
