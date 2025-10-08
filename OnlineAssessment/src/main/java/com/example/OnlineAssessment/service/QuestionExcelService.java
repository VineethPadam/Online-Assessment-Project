package com.example.OnlineAssessment.service;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
        // -------------------- QUIZ --------------------
        Quiz quiz = quizRepo.findById(quizId).orElse(new Quiz());
        quiz.setQuizId(quizId);
        quiz.setQuizName(quizName);
        quizRepo.save(quiz);

        // Store questionIds from Excel for later delete check
        Set<String> excelQuestionIds = new HashSet<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) { // skip header row
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String qId = formatter.formatCellValue(row.getCell(0)).trim();
                if (qId.isEmpty()) continue;
                excelQuestionIds.add(qId);

                // -------------------- QUESTION --------------------
                Questions q = questionRepo.findById(qId).orElse(new Questions());
                q.setQuestionId(qId);
                q.setQuestionText(formatter.formatCellValue(row.getCell(1)).trim());
                q.setQuiz(quiz);
                questionRepo.save(q);

                // -------------------- OPTIONS --------------------
                Options o = optionsRepo.findByQuestion_QuestionId(qId).orElse(new Options());
                o.setOption1(formatter.formatCellValue(row.getCell(2)).trim());
                o.setOption2(formatter.formatCellValue(row.getCell(3)).trim());
                o.setOption3(formatter.formatCellValue(row.getCell(4)).trim());
                o.setOption4(formatter.formatCellValue(row.getCell(5)).trim());

                String correctOption = formatter.formatCellValue(row.getCell(6)).trim();
                o.setCorrectOption(correctOption); // multiple correct allowed (comma-separated)

                o.setQuestion(q);
                optionsRepo.save(o);
            }
        }

        // -------------------- DELETE QUESTIONS NOT IN EXCEL --------------------
        List<Questions> dbQuestions = questionRepo.findByQuiz_QuizId(quizId);
        for (Questions dbQ : dbQuestions) {
            if (!excelQuestionIds.contains(dbQ.getQuestionId())) {
                // delete options first (if cascade = REMOVE is not enabled)
                optionsRepo.deleteByQuestion_QuestionId(dbQ.getQuestionId());
                questionRepo.delete(dbQ);
            }
        }
    }
}
