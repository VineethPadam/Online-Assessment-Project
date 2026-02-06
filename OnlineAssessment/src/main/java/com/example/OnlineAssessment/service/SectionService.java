package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.entity.Section;
import com.example.OnlineAssessment.repositories.QuizRepo;
import com.example.OnlineAssessment.repositories.SectionRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class SectionService {

    @Autowired
    private SectionRepo sectionRepo;

    @Autowired
    private QuizRepo quizRepo;

    @Transactional
    public Section createSection(Long quizId, String sectionName, String description, Long collegeId) {
        Quiz quiz = quizRepo.findByIdAndFaculty_College_Id(quizId, collegeId)
                .orElseThrow(() -> new RuntimeException("Quiz not found or access denied"));
        Section section = new Section();
        section.setSectionName(sectionName);
        section.setDescription(description);
        section.setQuiz(quiz);
        return sectionRepo.save(section);
    }

    public List<Section> getSectionsByQuizId(Long quizId) {
        return sectionRepo.findByQuizId(quizId);
    }

    @Transactional
    public void deleteSection(Long sectionId, Long collegeId) {
        Section section = sectionRepo.findById(sectionId).orElse(null);
        if (section != null) {
            Quiz quiz = section.getQuiz();
            if (quiz != null && quiz.getFaculty() != null && quiz.getFaculty().getCollege() != null
                    && quiz.getFaculty().getCollege().getId().equals(collegeId)) {
                quiz.getSections().remove(section);
                sectionRepo.delete(section);
            } else if (quiz != null) {
                throw new RuntimeException("Access denied to this section's quiz");
            }
        }
    }
}
