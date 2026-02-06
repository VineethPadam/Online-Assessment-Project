package com.example.OnlineAssessment.service;

import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Stream;

@Service
public class CompilerService {

    private static final String TEMP_DIR = "temp_code_exec";

    public CompilerService() {
        try {
            Files.createDirectories(Paths.get(TEMP_DIR));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static class ExecutionResult {
        public boolean success;
        public String output;
        public String error;
        public long executionTimeMs;
    }

    public ExecutionResult execute(String language, String code, String input) {
        return executeInDocker(language, code, input);
    }

    private ExecutionResult executeInDocker(String language, String code, String input) {
        Path workDir = createUniqueWorkDir();
        ExecutionResult result = new ExecutionResult();

        try {
            String fileName;
            String command;

            if ("java".equalsIgnoreCase(language)) {
                fileName = "Main.java";
                command = "javac /code/Main.java && java -cp /code Main";
            } else if ("c".equalsIgnoreCase(language)) {
                fileName = "solution.c";
                command = "gcc /code/solution.c -o /code/solution && /code/solution";
            } else if ("cpp".equalsIgnoreCase(language) || "c++".equalsIgnoreCase(language)) {
                fileName = "solution.cpp";
                command = "g++ /code/solution.cpp -o /code/solution && /code/solution";
            } else if ("python".equalsIgnoreCase(language) || "python3".equalsIgnoreCase(language)) {
                fileName = "solution.py";
                command = "python3 /code/solution.py";
            } else {
                result.success = false;
                result.error = "Unsupported language: " + language;
                return result;
            }

            Files.writeString(workDir.resolve(fileName), code);

            ProcessBuilder pb = new ProcessBuilder(
                    "docker", "run", "--rm", "-i",
                    "-v", workDir.toAbsolutePath() + ":/code",
                    "exam-compiler:latest",
                    "bash", "-c", command);

            long startTime = System.currentTimeMillis();
            Process process = pb.start();

            if (input != null && !input.isEmpty()) {
                try (OutputStream os = process.getOutputStream()) {
                    os.write(input.getBytes());
                    os.flush();
                }
            }

            boolean finished = process.waitFor(10, TimeUnit.SECONDS); // 10s for Docker overhead
            if (!finished) {
                process.destroyForcibly();
                result.success = false;
                result.error = "Time Limit Exceeded";
                return result;
            }

            result.executionTimeMs = System.currentTimeMillis() - startTime;
            result.output = readStream(process.getInputStream());
            result.error = readStream(process.getErrorStream());
            result.success = process.exitValue() == 0;

        } catch (Exception e) {
            result.success = false;
            result.error = "Server Error: " + e.getMessage();
        } finally {
            cleanup(workDir);
        }

        return result;
    }

    private Path createUniqueWorkDir() {
        try {
            return Files.createTempDirectory(Paths.get(TEMP_DIR), "exec_");
        } catch (IOException e) {
            throw new RuntimeException("Failed to create work dir", e);
        }
    }

    private String readStream(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString();
    }

    private void cleanup(Path dir) {
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException e) {
                            // ignore
                        }
                    });
        } catch (IOException e) {
            // ignore
        }
    }
}
