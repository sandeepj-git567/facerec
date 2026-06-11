package com.facesecureai.service.ai;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class OpenCvFaceEngineTest {

    private OpenCvFaceEngine faceEngine;

    @BeforeEach
    public void setUp() {
        faceEngine = new OpenCvFaceEngine();
    }

    @Test
    public void testMatchIdenticalEmbeddings() {
        // Create an arbitrary 128-float unit vector
        float[] vectorA = new float[128];
        float sumOfSquares = 0.0f;
        for (int i = 0; i < 128; i++) {
            vectorA[i] = (float) Math.sin(i);
            sumOfSquares += vectorA[i] * vectorA[i];
        }
        float norm = (float) Math.sqrt(sumOfSquares);
        for (int i = 0; i < 128; i++) {
            vectorA[i] /= norm;
        }

        // Match with itself
        double confidence = faceEngine.matchEmbeddings(vectorA, vectorA);
        
        // Assert: confidence must be high (close to 100)
        assertTrue(confidence >= 99.0, "Identical vectors must return high match confidence");
    }

    @Test
    public void testMatchOrthogonalEmbeddings() {
        // Create two orthogonal vectors
        float[] vectorA = new float[128];
        float[] vectorB = new float[128];
        
        vectorA[0] = 1.0f; // orthogonal unit vector along axis 0
        vectorB[1] = 1.0f; // orthogonal unit vector along axis 1

        double confidence = faceEngine.matchEmbeddings(vectorA, vectorB);
        
        // Assert: orthogonal vectors (similarity = 0) must return low confidence
        assertTrue(confidence < 60.0, "Orthogonal vectors must return low match confidence");
    }

    @Test
    public void testMatchNullEmbeddings() {
        double confidence = faceEngine.matchEmbeddings(null, new float[128]);
        assertEquals(0.0, confidence, "Null vectors must yield 0 confidence");
    }
}
