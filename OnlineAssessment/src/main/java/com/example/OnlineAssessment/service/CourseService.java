package com.example.OnlineAssessment.service;

import com.example.OnlineAssessment.entity.Course;
import com.example.OnlineAssessment.repositories.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CourseService {
    @Autowired
    private CourseRepository courseRepository;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course saveCourse(Course course) {
        if (course == null)
            return null;
        return courseRepository.save(course);
    }

    public void deleteCourse(Long id) {
        if (id != null) {
            courseRepository.deleteById(id);
        }
    }
}
