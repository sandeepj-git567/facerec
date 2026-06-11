package com.facesecureai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RecognitionRequest {
    @NotBlank
    private String image; // Base64-encoded image of the scanned face

    private String deviceInfo; // Camera location name
}
