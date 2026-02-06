package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.TrainingApproach;
import com.example.OnlineAssessment.repositories.TrainingApproachRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TrainingApproachService {
    @Autowired
    private TrainingApproachRepository trainingApproachRepository;

    public List<TrainingApproach> getAllApproaches() {
        return trainingApproachRepository.findAll();
    }

    public TrainingApproach saveApproach(TrainingApproach approach) {
        if (approach == null)
            return null;
        return trainingApproachRepository.save(approach);
    }

    public void deleteApproach(Long id) {
        if (id != null) {
            trainingApproachRepository.deleteById(id);
        }
    }
}
