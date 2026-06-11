package com.facesecureai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.facesecureai.dto.EnrollmentRequest;
import com.facesecureai.dto.FaceMatchResult;
import com.facesecureai.dto.RecognitionRequest;
import com.facesecureai.exception.FaceRecognitionException;
import com.facesecureai.exception.ResourceNotFoundException;
import com.facesecureai.model.FaceEmbedding;
import com.facesecureai.model.RecognitionLog;
import com.facesecureai.model.User;
import com.facesecureai.repository.FaceEmbeddingRepository;
import com.facesecureai.repository.RecognitionLogRepository;
import com.facesecureai.repository.UserRepository;
import com.facesecureai.service.ai.OpenCvFaceEngine;
import com.facesecureai.util.FileStorageUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Service
@Transactional
@Slf4j
public class FaceServiceImpl implements FaceService {

    @Autowired
    private FaceEmbeddingRepository faceEmbeddingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecognitionLogRepository recognitionLogRepository;

    @Autowired
    private OpenCvFaceEngine faceEngine;

    @Autowired
    private FileStorageUtils fileStorageUtils;

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.storage.faces-dir}")
    private String facesDir;

    @Value("${app.storage.snapshots-dir}")
    private String snapshotsDir;

    @Override
    public void enrollUser(EnrollmentRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));

        log.info("Starting facial enrollment for user: {}", user.getUsername());

        // Validate that we got images
        if (request.getImages() == null || request.getImages().isEmpty()) {
            throw new FaceRecognitionException("At least one enrollment image is required!");
        }

        // Clean previous enrollments for fresh registration (as requested by User Management / Re-enroll)
        faceEmbeddingRepository.deleteByUserId(user.getId());

        int successCount = 0;
        for (int i = 0; i < request.getImages().size(); i++) {
            String base64Image = request.getImages().get(i);
            try {
                // Decode image and check face presence
                byte[] decodedBytes = decodeBase64(base64Image);
                boolean faceDetected = faceEngine.detectFace(decodedBytes);
                
                if (!faceDetected) {
                    throw new FaceRecognitionException("Face quality validation failed. No face detected in image " + (i + 1));
                }

                // Generate embedding vector
                float[] embedding = faceEngine.generateEmbedding(decodedBytes);
                String embeddingJson = objectMapper.writeValueAsString(embedding);

                // Save image to server filesystem
                String savedFileName = fileStorageUtils.saveBase64Image(base64Image, facesDir, "user_" + user.getId());

                // Save embedding details to database
                FaceEmbedding faceEmbedding = FaceEmbedding.builder()
                        .user(user)
                        .embedding(embeddingJson)
                        .imagePath(savedFileName)
                        .build();

                faceEmbeddingRepository.save(faceEmbedding);
                successCount++;
            } catch (FaceRecognitionException fre) {
                throw fre;
            } catch (Exception e) {
                log.error("Failed processing image {}: {}", i, e.getMessage());
                throw new FaceRecognitionException("Error enrolling face image " + (i + 1) + ": " + e.getMessage());
            }
        }

        log.info("Successfully registered {} face embeddings for user: {}", successCount, user.getUsername());
    }

    @Override
    public FaceMatchResult recognizeFace(RecognitionRequest request) {
        log.info("Initiating facial recognition scan...");
        
        try {
            // Save snapshot evidence
            String snapshotFile = fileStorageUtils.saveBase64Image(request.getImage(), snapshotsDir, "scan");
            byte[] decodedBytes = decodeBase64(request.getImage());

            // 1. Detect if face exists in scan
            boolean faceDetected = faceEngine.detectFace(decodedBytes);
            if (!faceDetected) {
                // Log failure
                RecognitionLog logEntry = RecognitionLog.builder()
                        .confidence(0.0)
                        .snapshotPath(snapshotFile)
                        .status("FAILURE")
                        .deviceInfo(request.getDeviceInfo())
                        .build();
                recognitionLogRepository.save(logEntry);

                return FaceMatchResult.builder()
                        .matched(false)
                        .confidence(0.0)
                        .status("FAILURE")
                        .message("No face detected in scan frame")
                        .build();
            }

            // 2. Generate scanned embedding
            float[] scanEmbedding = faceEngine.generateEmbedding(decodedBytes);

            // 3. Scan database for matches (1:N matching)
            List<FaceEmbedding> enrolledList = faceEmbeddingRepository.findAll();
            
            double bestScore = 0.0;
            User bestMatchedUser = null;

            for (FaceEmbedding dbFace : enrolledList) {
                float[] dbEmbedding = objectMapper.readValue(dbFace.getEmbedding(), new TypeReference<float[]>() {});
                double score = faceEngine.matchEmbeddings(scanEmbedding, dbEmbedding);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatchedUser = dbFace.getUser();
                }
            }

            // 4. Threshold check (e.g. match threshold is integrated in matchEmbeddings where a match is >= 85%)
            boolean isMatched = bestScore >= 80.0 && bestMatchedUser != null; // threshold can be 80% confidence

            if (isMatched && "ACTIVE".equals(bestMatchedUser.getStatus())) {
                // Clock-in / Out
                String attendanceStatus = attendanceService.markAttendance(bestMatchedUser.getId());

                // Save SUCCESS log
                RecognitionLog logEntry = RecognitionLog.builder()
                        .matchedUser(bestMatchedUser)
                        .confidence(bestScore)
                        .snapshotPath(snapshotFile)
                        .status("SUCCESS")
                        .deviceInfo(request.getDeviceInfo())
                        .build();
                recognitionLogRepository.save(logEntry);

                return FaceMatchResult.builder()
                        .matched(true)
                        .confidence(bestScore)
                        .userId(bestMatchedUser.getId())
                        .username(bestMatchedUser.getUsername())
                        .fullName(bestMatchedUser.getFullName())
                        .status("SUCCESS")
                        .message("Face matched successfully! Attendance marked: " + attendanceStatus)
                        .build();
            } else {
                // Unrecognized face OR user account suspended
                String status = bestMatchedUser != null && !"ACTIVE".equals(bestMatchedUser.getStatus()) ? "FAILURE" : "UNKNOWN";
                String message = status.equals("FAILURE") ? "Matched user account is inactive" : "Unknown face scanned";
                
                RecognitionLog logEntry = RecognitionLog.builder()
                        .confidence(bestScore)
                        .snapshotPath(snapshotFile)
                        .status(status)
                        .deviceInfo(request.getDeviceInfo())
                        .build();
                recognitionLogRepository.save(logEntry);

                return FaceMatchResult.builder()
                        .matched(false)
                        .confidence(bestScore)
                        .status(status)
                        .message(message)
                        .build();
            }

        } catch (Exception e) {
            log.error("Face recognition processing failure: {}", e.getMessage(), e);
            throw new FaceRecognitionException("System error during face recognition: " + e.getMessage());
        }
    }

    @Override
    public boolean hasFaceRegistered(Long userId) {
        return !faceEmbeddingRepository.findByUserId(userId).isEmpty();
    }

    private byte[] decodeBase64(String base64Image) {
        String cleanBase64 = base64Image;
        if (base64Image.contains(",")) {
            cleanBase64 = base64Image.substring(base64Image.indexOf(",") + 1);
        }
        return Base64.getDecoder().decode(cleanBase64.trim());
    }
}
