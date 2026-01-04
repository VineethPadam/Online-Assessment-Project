package com.example.OnlineAssessment.service;

import java.io.InputStream;
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

    public void uploadQuestions(MultipartFile file, String quizId) throws Exception {

        // 1️⃣ Quiz must already exist
        Quiz quiz = quizRepo.findById(quizId)
                .orElseThrow(() ->
                        new RuntimeException("Quiz does not exist. Create quiz first.")
                );

        // 2️⃣ BLOCK DUPLICATE UPLOAD (VERY IMPORTANT)
        List<Questions> existingQuestions = questionRepo.findByQuiz_QuizId(quizId);
        if (!existingQuestions.isEmpty()) {
            throw new RuntimeException(
                    "Questions already uploaded for this Quiz ID. Re-upload is not allowed."
            );
        }

        // 3️⃣ Read Excel
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) { // skip header
                Row row = sheet.getRow(i);
                if (row == null) continue;

                // QUESTION (ID AUTO-GENERATED)
                Questions q = new Questions();
                q.setQuestionText(
                        formatter.formatCellValue(row.getCell(0)).trim()
                );
                q.setQuiz(quiz);
                questionRepo.save(q); // UUID generated here

                // OPTIONS
                Options o = new Options();
                o.setOption1(formatter.formatCellValue(row.getCell(1)).trim());
                o.setOption2(formatter.formatCellValue(row.getCell(2)).trim());
                o.setOption3(formatter.formatCellValue(row.getCell(3)).trim());
                o.setOption4(formatter.formatCellValue(row.getCell(4)).trim());
                o.setCorrectOption(
                        formatter.formatCellValue(row.getCell(5)).trim()
                );

                o.setQuestion(q);
                optionsRepo.save(o);
            }
        }
    }
}
