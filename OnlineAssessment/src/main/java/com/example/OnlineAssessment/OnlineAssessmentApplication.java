package com.example.OnlineAssessment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OnlineAssessmentApplication {

	public static void main(String[] args) {
		SpringApplication.run(OnlineAssessmentApplication.class, args);
	}

}
