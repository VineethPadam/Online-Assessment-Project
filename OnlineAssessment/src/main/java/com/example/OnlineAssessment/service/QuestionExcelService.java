package com.example.OnlineAssessment.service;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.OnlineAssessment.entity.Options;
import com.example.OnlineAssessment.entity.Questions;
import com.example.OnlineAssessment.entity.Quiz;
import com.example.OnlineAssessment.repositories.OptionsRepo;
import com.example.OnlineAssessment.repositories.QuestionRepo;
import com.example.OnlineAssessment.repositories.QuizRepo;

@Service
public class QuestionExcelService {

    @Autowired
    private QuestionRepo questionRepo;

    @Autowired
    private OptionsRepo optionsRepo;

    @Autowired
    private QuizRepo quizRepo;

    public void uploadQuestions(MultipartFile file, String quizName, String quizId) throws Exception {
        // Check if quiz exists; create only if it doesn't
        Quiz quiz = quizRepo.findById(quizId).orElse(null);
        if (quiz == null) {
            quiz = new Quiz();
            quiz.setQuizId(quizId);
            quiz.setQuizName(quizName);
            quizRepo.save(quiz);
        }

        // Read Excel
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter(); // ensures everything is read as string

            for (int i = 1; i < sheet.getPhysicalNumberOfRows(); i++) { // skip header row
                Row row = sheet.getRow(i);
                if (row == null) continue;

                // Question
                Questions q = new Questions();
                String qId = formatter.formatCellValue(row.getCell(0)).trim();
                if (qId.isEmpty()) continue; // skip empty rows

                if (questionRepo.existsById(qId)) continue;

                q.setQuestionId(qId);
                q.setQuestionText(formatter.formatCellValue(row.getCell(1)).trim());
                q.setQuiz(quiz);  // link to correct quiz
                questionRepo.save(q);

                // Options
                Options o = new Options();
                o.setOption1(formatter.formatCellValue(row.getCell(2)).trim());
                o.setOption2(formatter.formatCellValue(row.getCell(3)).trim());
                o.setOption3(formatter.formatCellValue(row.getCell(4)).trim());
                o.setOption4(formatter.formatCellValue(row.getCell(5)).trim());
                o.setCorrectOption(formatter.formatCellValue(row.getCell(6)).trim());
                o.setQuestion(q);
                optionsRepo.save(o);
            }
        }
    }
}
