package com.facesecureai.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.BAD_REQUEST)
public class FaceRecognitionException extends RuntimeException {
    public FaceRecognitionException(String message) {
        super(message);
    }
}
