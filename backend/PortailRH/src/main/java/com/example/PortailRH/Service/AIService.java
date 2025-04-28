package com.example.PortailRH.Service;

import com.example.PortailRH.Model.candidat;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;


@Service
public class AIService {
    private static final Logger logger = LoggerFactory.getLogger(AIService.class);
    private final ObjectMapper objectMapper;
    private final ResourceLoader resourceLoader;

    @Value("${ai.python.path:python}")
    private String pythonPath;

    @Value("${ai.process.timeout.minutes:3}")
    private int processTimeout;

    @Value("classpath:ai_script.py")
    private Resource aiScriptResource;

    @Autowired
    public AIService(ObjectMapper objectMapper, ResourceLoader resourceLoader) {
        this.objectMapper = objectMapper;
        this.resourceLoader = resourceLoader;
    }

    // verifyPythonEnvironment and checkPythonDependencies remain the same as before...
    public boolean verifyPythonEnvironment() {
        // Check specified pythonPath first
        if (checkPythonDependencies(pythonPath)) {
            logger.info("Python environment check successful using configured path: {}", pythonPath);
            return true;
        }
        logger.warn("Python environment check failed using configured path: {}", pythonPath);

        // Fallback: Check for venv (adjust paths for Linux/macOS if needed)
        Path venvPythonWin = Paths.get(System.getProperty("user.dir"), "venv", "Scripts", "python.exe");
        Path venvPythonNix = Paths.get(System.getProperty("user.dir"), "venv", "bin", "python");

        if (Files.exists(venvPythonWin) && checkPythonDependencies(venvPythonWin.toString())) {
            logger.info("Python environment check successful using Windows venv: {}", venvPythonWin);
            this.pythonPath = venvPythonWin.toString(); // Update path if venv works
            return true;
        }
        if (Files.exists(venvPythonNix) && checkPythonDependencies(venvPythonNix.toString())) {
            logger.info("Python environment check successful using Unix venv: {}", venvPythonNix);
            this.pythonPath = venvPythonNix.toString(); // Update path if venv works
            return true;
        }
        logger.error("Python environment check failed for both configured path and venv.");
        return false;
    }

    private boolean checkPythonDependencies(String pythonExec) {
        logger.info("Checking Python dependencies using executable: {}", pythonExec);
        Process process = null;
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    pythonExec,
                    "-c",
                    "import sys; import PyPDF2; import requests; print('OK')");
            process = pb.start();
            String stdOut;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                stdOut = reader.lines().collect(Collectors.joining("\n"));
            }
            String stdErr;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                stdErr = reader.lines().collect(Collectors.joining("\n"));
            }
            boolean exited = process.waitFor(15, TimeUnit.SECONDS);
            int exitCode = exited ? process.exitValue() : -1;
            logger.info("Python dependency check stdout: {}", stdOut);
            if (!stdErr.isEmpty()) {
                logger.warn("Python dependency check stderr: {}", stdErr);
            }
            if (exited && exitCode == 0 && stdOut.contains("OK")) {
                logger.info("Python dependencies (PyPDF2, requests) confirmed for {}", pythonExec);
                return true;
            } else {
                logger.error("""
                    Python dependency check failed for {}. Exit code: {}. Required: PyPDF2, requests. Install with: '{} -m pip install PyPDF2 requests'. Test with: '{} -c "import PyPDF2, requests; print('OK')"'""", pythonExec, exitCode, pythonExec, pythonExec);
                if (!stdErr.isEmpty()) {
                    logger.error("Dependency check stderr: {}", stdErr);
                }
                return false;
            }
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            logger.error("Exception during Python dependency check for {}: {}", pythonExec, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            logger.error("Unexpected exception during Python dependency check for {}: {}", pythonExec, e.getMessage(), e);
            return false;
        } finally {
            if (process != null) process.destroy();
        }
    }


    // analyseCVWithLlama remains the same as before (executes script, parses output)...
    public Map<String, Object> analyseCVWithLlama(String cvFilePath) throws Exception {
        if (!aiScriptResource.exists()) {
            logger.error("AI script resource not found at classpath:ai_script.py");
            throw new FileNotFoundException("AI script resource not found");
        }
        if (!verifyPythonEnvironment()) {
            logger.error("Python environment verification failed before CV analysis.");
            throw new Exception("Python environment not configured or dependencies missing.");
        }

        Path scriptPath = null;
        Process process = null;
        try {
            scriptPath = Files.createTempFile("ai_script_", ".py");
            try (InputStream is = aiScriptResource.getInputStream()) {
                Files.copy(is, scriptPath, StandardCopyOption.REPLACE_EXISTING);
            }
            Path absoluteCvPath = Paths.get(cvFilePath).toAbsolutePath();
            if (!Files.exists(absoluteCvPath)) {
                throw new FileNotFoundException("CV file not found: " + absoluteCvPath);
            }
            List<String> command = List.of(getPythonExecutable(), scriptPath.toString(), absoluteCvPath.toString());
            ProcessBuilder pb = new ProcessBuilder(command).redirectErrorStream(false); // Capture stderr separately
            logger.info("Executing AI script command: {}", String.join(" ", command));
            process = pb.start();
            CompletableFuture<String> stdOutFuture = readStream(process.getInputStream(), "STDOUT");
            CompletableFuture<String> stdErrFuture = readStream(process.getErrorStream(), "STDERR");
            boolean exited = process.waitFor(processTimeout, TimeUnit.MINUTES);
            String stdOut = stdOutFuture.get(10, TimeUnit.SECONDS);
            String stdErr = stdErrFuture.get(10, TimeUnit.SECONDS);
            logger.info("AI Script STDOUT:\n{}", stdOut);
            if (!stdErr.isEmpty()) logger.warn("AI Script STDERR:\n{}", stdErr);
            if (!exited) {
                process.destroyForcibly();
                throw new TimeoutException("AI script processing timed out after " + processTimeout + " minutes.");
            }
            int exitCode = process.exitValue();
            logger.info("AI script finished with exit code: {}", exitCode);
            if (exitCode != 0) {
                throw new Exception("AI script failed with exit code " + exitCode + ". Check script logs (STDERR). STDERR: " + stdErr);
            }
            if (stdOut.trim().isEmpty()) {
                throw new Exception("AI script produced no output (stdout) despite successful execution (exit code 0).");
            }
            return parseAIOutput(stdOut, stdErr); // Returns map parsed from stdout JSON

        } catch (IOException | InterruptedException | ExecutionException | TimeoutException e) {
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            logger.error("Error during AI script execution/processing: {}", e.getMessage(), e);
            throw new Exception("Failed during AI script execution/processing: " + e.getMessage(), e);
        } catch (Exception e) { // Catch any other unexpected errors
            logger.error("Unexpected error during AI analysis: {}", e.getMessage(), e);
            throw e;
        } finally {
            if (process != null) process.destroy();
            if (scriptPath != null) try { Files.deleteIfExists(scriptPath); } catch (IOException e) { logger.warn("Failed to delete temp AI script: {}", scriptPath); }
        }
    }

    // readStream, getPythonExecutable, parseAIOutput remain the same...
    private CompletableFuture<String> readStream(InputStream inputStream, String streamType) {
        return CompletableFuture.supplyAsync(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                return reader.lines().collect(Collectors.joining("\n"));
            } catch (UncheckedIOException | IOException e) {
                logger.error("Error reading process stream [{}]: {}", streamType, e.getMessage());
                return "Error reading stream: " + e.getMessage();
            }
        });
    }
    private String getPythonExecutable() { return this.pythonPath; }
    private Map<String, Object> parseAIOutput(String output, String errors) throws IOException {
        String trimmedOutput = output.trim();
        if (!trimmedOutput.startsWith("{") || !trimmedOutput.endsWith("}")) {
            logger.error("AI script output does not appear to be valid JSON. Output:\n{}", output);
            logger.error("AI script errors (if any) that might explain the bad output:\n{}", errors);
            throw new IOException("AI script output is not valid JSON. Check script logs (stderr).");
        }
        try {
            return objectMapper.readValue(trimmedOutput, new TypeReference<>() {});
        } catch (IOException e) {
            logger.error("Failed to parse JSON output from AI script: {}", e.getMessage());
            logger.error("Raw output was:\n{}", output);
            logger.error("AI script errors (if any):\n{}", errors);
            throw new IOException("Failed to parse JSON from AI script: " + e.getMessage() + ". Raw output snippet: " + output.substring(0, Math.min(output.length(), 500)), e);
        }
    }


    /**
     * Updates candidate with results from AI analysis.
     * IMPORTANT: This method now ONLY updates skills, strengths, and weaknesses.
     * Score, matchPercentage, and accepted status are calculated separately.
     */
    public void updateCandidateWithAIResults(candidat candidate, Map<String, Object> aiResult) {
        if (candidate == null || aiResult == null || aiResult.isEmpty()) {
            logger.warn("Skipping candidate update due to null candidate or empty/null AI results.");
            // Ensure candidate has non-null maps/lists even if AI result is bad
            if(candidate != null) {
                if(candidate.getTechnicalSkills() == null) candidate.setTechnicalSkills(new HashMap<>());
                if(candidate.getLanguageSkills() == null) candidate.setLanguageSkills(new HashMap<>());
                if(candidate.getStrengths() == null) candidate.setStrengths(new ArrayList<>());
                if(candidate.getWeaknesses() == null) candidate.setWeaknesses(new ArrayList<>());
            }
            return;
        }

        // Check the status field added by the python script wrapper
        if ("failed".equals(aiResult.get("status"))) {
            logger.error("AI script reported failure. Error: {}. Not updating candidate {} skills.", aiResult.get("error"), candidate.getId());
            // Ensure candidate has non-null maps/lists
            if(candidate.getTechnicalSkills() == null) candidate.setTechnicalSkills(new HashMap<>());
            if(candidate.getLanguageSkills() == null) candidate.setLanguageSkills(new HashMap<>());
            if(candidate.getStrengths() == null) candidate.setStrengths(new ArrayList<>());
            if(candidate.getWeaknesses() == null) candidate.setWeaknesses(new ArrayList<>());
            return;
        }


        logger.info("Updating candidate {} with AI results (Skills, Strengths, Weaknesses only): {}", candidate.getId(), aiResult);
        try {
            // Update only the fields directly extracted by the modified AI prompt
            candidate.setTechnicalSkills(convertToSkillMap(aiResult.get("technicalSkills")));
            candidate.setLanguageSkills(convertToSkillMap(aiResult.get("languageSkills")));
            candidate.setStrengths(convertToList(aiResult.get("strengths")));
            candidate.setWeaknesses(convertToList(aiResult.get("weaknesses")));

            // Score, MatchPercentage, Accepted are NO LONGER SET HERE. They are calculated later.

            logger.info("Candidate {} updated with skills, strengths, weaknesses from AI.", candidate.getId());

        } catch (Exception e) {
            logger.error("Error mapping AI results to candidate {} fields: {}. AI Result was: {}",
                    candidate.getId(), e.getMessage(), aiResult, e);
            // Ensure maps/lists are not null after error
            if(candidate.getTechnicalSkills() == null) candidate.setTechnicalSkills(new HashMap<>());
            if(candidate.getLanguageSkills() == null) candidate.setLanguageSkills(new HashMap<>());
            if(candidate.getStrengths() == null) candidate.setStrengths(new ArrayList<>());
            if(candidate.getWeaknesses() == null) candidate.setWeaknesses(new ArrayList<>());
        }
    }

    // convertToSkillMap, convertToList, convertToDouble remain the same...
    private Map<String, Double> convertToSkillMap(Object skills) {
        Map<String, Double> result = new HashMap<>();
        if (skills instanceof Map<?, ?> skillsMap) {
            skillsMap.forEach((key, value) -> {
                if (key != null && value instanceof Number) {
                    try { result.put(key.toString(), ((Number) value).doubleValue()); }
                    catch (Exception e) { logger.warn("Could not convert skill value for key '{}' to Double: {}", key, value, e); }
                } else { logger.warn("Skipping invalid skill entry: key={}, value={}", key, value); }
            });
        } else if (skills != null) { logger.warn("Expected 'skills' to be a Map, but got: {}", skills.getClass().getName()); }
        return result;
    }
    private List<String> convertToList(Object list) {
        List<String> result = new ArrayList<>();
        if (list instanceof List<?> rawList) {
            rawList.forEach(item -> {
                if (item != null) { result.add(item.toString()); }
                else { logger.warn("Skipping null item in list conversion."); }
            });
        } else if (list != null) { logger.warn("Expected 'strengths/weaknesses' to be a List, but got: {}", list.getClass().getName()); }
        return result;
    }
    private Double convertToDouble(Object number) { // Still needed internally? Keep for now.
        if (number instanceof Number) { return ((Number) number).doubleValue(); }
        else if (number != null) { logger.warn("Expected a Number, but got: {}", number.getClass().getName()); }
        return 0.0;
    }
}