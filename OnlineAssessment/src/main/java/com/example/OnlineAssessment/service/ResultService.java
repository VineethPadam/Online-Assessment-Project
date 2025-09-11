package com.example.OnlineAssessment.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.entity.Result;
import com.example.OnlineAssessment.entity.Student;
import com.example.OnlineAssessment.repositories.QuizRepo;
import com.example.OnlineAssessment.repositories.ResultRepo;
import com.example.OnlineAssessment.repositories.studentRepo;

@Service
public class ResultService {

    @Autowired
    private ResultRepo resultRepo;

    @Autowired
    private studentRepo studentRepo;

    @Autowired
    private QuizRepo quizRepo;

    public Result saveResult(Result result){
        Student student = studentRepo.findById(result.getStudent().getStudentRollNumber())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Quiz quiz = quizRepo.findById(result.getQuiz().getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        // Check if student already attempted this quiz
        List<Result> existing = resultRepo.findResultsByStudentRollNumber(student.getStudentRollNumber());
        for(Result r : existing){
            if(r.getQuiz().getQuizId() == quiz.getQuizId()){
                throw new RuntimeException("You have already attempted this quiz");
            }
        }

        result.setStudent(student);
        result.setQuiz(quiz);
        return resultRepo.save(result);
    }

    public List<Result> getResultsBySectionAndDepartment(String section, String department, Integer quizId){
        List<Result> results = resultRepo.findResultsBySectionAndDepartment(section, department);
        if(quizId == null) {
			return results;
		}

        List<Result> filtered = new ArrayList<>();
        for(Result r : results){
            if(r.getQuiz().getQuizId() == quizId) {
				filtered.add(r);
			}
        }
        return filtered;
    }

    public List<Result> getResultsByStudentRollNumber(String rollNumber, Integer quizId){
        List<Result> results = resultRepo.findResultsByStudentRollNumber(rollNumber);
        if(quizId == null) {
			return results;
		}

        List<Result> filtered = new ArrayList<>();
        for(Result r : results){
            if(r.getQuiz().getQuizId() == quizId) {
				filtered.add(r);
			}
        }
        return filtered;
    }
}
