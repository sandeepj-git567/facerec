package com.facesecureai.service;

import com.facesecureai.dto.EnrollmentRequest;
import com.facesecureai.dto.FaceMatchResult;
import com.facesecureai.dto.RecognitionRequest;

public interface FaceService {
    void enrollUser(EnrollmentRequest enrollmentRequest);
    FaceMatchResult recognizeFace(RecognitionRequest recognitionRequest);
    boolean hasFaceRegistered(Long userId);
}
