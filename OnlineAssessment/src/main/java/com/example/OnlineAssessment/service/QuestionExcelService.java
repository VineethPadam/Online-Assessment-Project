package com.example.OnlineAssessment.service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

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

        public void uploadQuestions(MultipartFile file, Long quizId) throws Exception {

                Quiz quiz = quizRepo.findById(quizId)
                                .orElseThrow(() -> new RuntimeException("Quiz does not exist. Create quiz first."));

                List<Questions> existingQuestions = questionRepo.findByQuiz_Id(quizId);
                if (!existingQuestions.isEmpty()) {
                        throw new RuntimeException("Questions already uploaded for this Quiz ID.");
                }

                try (InputStream is = file.getInputStream();
                                Workbook workbook = new XSSFWorkbook(is)) {

                        Sheet sheet = workbook.getSheetAt(0);
                        DataFormatter formatter = new DataFormatter();

                        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                                Row row = sheet.getRow(i);
                                if (row == null)
                                        continue;

                                Questions q = new Questions();
                                q.setQuestionText(formatter.formatCellValue(row.getCell(0)).trim());
                                q.setQuiz(quiz);
                                q.setMarks(1.0); // Default
                                q.setNegativeMarks(0.0); // Default

                                Options o = new Options();
                                List<String> choices = new ArrayList<>();
                                for (int col = 1; col <= 4; col++) {
                                        String val = formatter.formatCellValue(row.getCell(col)).trim();
                                        if (!val.isEmpty())
                                                choices.add(val);
                                }
                                o.setChoices(choices);
                                o.setCorrectOption(formatter.formatCellValue(row.getCell(5)).trim());
                                o.setQuestion(q);

                                q.setOptions(o);
                                questionRepo.save(q);
                        }
                }
        }
}
