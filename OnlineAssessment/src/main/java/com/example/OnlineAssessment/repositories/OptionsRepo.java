package com.example.OnlineAssessment.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.OnlineAssessment.entity.Options;

public interface OptionsRepo extends JpaRepository<Options, Integer> {

    // Fetch options for a question (wrapped in Optional)
    Optional<Options> findByQuestion_QuestionId(String questionId);

    // Delete options by questionId
    void deleteByQuestion_QuestionId(String questionId);
}
