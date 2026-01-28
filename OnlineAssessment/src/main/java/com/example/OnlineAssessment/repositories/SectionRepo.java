package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SectionRepo extends JpaRepository<Section, Long> {
    List<Section> findByQuizId(Long quizId);
}
