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
    public Section createSection(Long quizId, String sectionName, String description) {
        Quiz quiz = quizRepo.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz not found"));
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
    public void deleteSection(Long sectionId) {
        sectionRepo.deleteById(sectionId);
    }
}
