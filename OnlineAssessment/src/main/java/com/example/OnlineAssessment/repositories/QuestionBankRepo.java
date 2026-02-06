package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.QuestionBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionBankRepo extends JpaRepository<QuestionBank, String> {

    @Query("SELECT DISTINCT c FROM QuestionBank q JOIN q.companies c")
    List<String> findDistinctCompanies();

    @Query("SELECT DISTINCT q.topic FROM QuestionBank q WHERE q.category = :category")
    List<String> findDistinctTopics(String category);

    // Filters handled by JPA JOIN
    @Query("SELECT q FROM QuestionBank q JOIN q.companies c WHERE c = :company AND q.category = :category AND q.topic = :topic AND q.difficulty = :difficulty")
    List<QuestionBank> findByCompanyAndCategoryAndTopicAndDifficulty(String company, String category, String topic,
            String difficulty);

    @Query("SELECT q FROM QuestionBank q JOIN q.companies c WHERE c = :company AND q.category = :category AND q.topic = :topic")
    List<QuestionBank> findByCompanyAndCategoryAndTopic(String company, String category, String topic);

    @Query("SELECT q FROM QuestionBank q JOIN q.companies c WHERE c = :company AND q.category = :category")
    List<QuestionBank> findByCompanyAndCategory(String company, String category);

    @Query("SELECT q FROM QuestionBank q JOIN q.companies c WHERE c = :company")
    List<QuestionBank> findByCompany(String company);
}
