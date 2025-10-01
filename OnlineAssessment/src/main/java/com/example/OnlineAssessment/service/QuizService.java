	package com.example.OnlineAssessment.service;
	
	import java.util.List;
	
	import org.springframework.beans.factory.annotation.Autowired;
	import org.springframework.stereotype.Service;
	
	import com.example.OnlineAssessment.entity.Quiz;
	import com.example.OnlineAssessment.entity.QuizActivation;
	import com.example.OnlineAssessment.repositories.QuizRepo;
	import com.example.OnlineAssessment.repositories.QuizActivationRepo;
	
	@Service
	public class QuizService {
	
	    @Autowired
	    private QuizRepo quizRepo;
	
	    @Autowired
	    private QuizActivationRepo quizActivationRepo;
	
	    // ✅ Create a new quiz if it doesn't exist
	    public Quiz createQuiz(String quizId, String quizName) {
	        for (Quiz q : quizRepo.findAll()) {
	            if (q.getQuizId().equalsIgnoreCase(quizId) || q.getQuizName().equalsIgnoreCase(quizName)) {
	                return q; // Return existing quiz
	            }
	        }
	        Quiz quiz = new Quiz();
	        quiz.setQuizId(quizId);
	        quiz.setQuizName(quizName);
	        return quizRepo.save(quiz);
	    }
	
	    // ✅ Activate or deactivate a quiz for a specific section/department/year
	    public QuizActivation activateQuiz(String quizId, String section, String department, int year, boolean active) {
	        Quiz quiz = quizRepo.findById(quizId)
	                .orElseThrow(() -> new RuntimeException("Quiz not found"));
	
	        QuizActivation qa = quizActivationRepo.findByQuizIdSectionDeptYearIgnoreCase(quizId, section, department, year);
	        if (qa == null) {
	            qa = new QuizActivation();
	            qa.setQuiz(quiz);
	            qa.setSection(section);
	            qa.setDepartment(department);
	            qa.setYear(year);
	        }
	        qa.setActive(active);
	        QuizActivation saved = quizActivationRepo.save(qa);
	        System.out.println("Quiz " + quizId + " activated for " + section + "-" + department + "-" + year + " -> " + active);
	        return saved;
	    }
	
	    // ✅ Get all active quizzes for a student (case-insensitive)
	    public List<QuizActivation> getActiveQuizzesForStudent(String section, String department, int year) {
	        List<QuizActivation> activeQuizzes = quizActivationRepo.findActiveQuizzesIgnoreCase(section, department, year);
	        System.out.println("Active quizzes for " + section + "-" + department + "-" + year + ":");
	        activeQuizzes.forEach(q -> System.out.println(q.getQuiz().getQuizId() + " -> " + q.isActive()));
	        return activeQuizzes;
	    }
	
	    // ✅ Check if a student can access a specific quiz (case-insensitive)
	    public boolean isQuizActiveForStudent(String quizId, String section, String department, int year) {
	        QuizActivation qa = quizActivationRepo.findByQuizIdSectionDeptYearIgnoreCase(quizId, section, department, year);
	        if (qa == null) {
	            System.out.println("No QuizActivation found for: " + quizId + " " + section + " " + department + " " + year);
	            return false;
	        }
	        System.out.println("Found activation: " + qa.getQuiz().getQuizId() + " -> active=" + qa.isActive());
	        return qa.isActive();
	    }
	}
