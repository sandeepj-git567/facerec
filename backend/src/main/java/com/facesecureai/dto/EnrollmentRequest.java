package com.facesecureai.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class EnrollmentRequest {
    @NotNull
    private Long userId;

    @NotEmpty
    private List<String> images; // List of base64-encoded JPEG/PNG images
}
