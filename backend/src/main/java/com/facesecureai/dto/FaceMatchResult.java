package com.facesecureai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaceMatchResult {
    private boolean matched;
    private double confidence;
    private Long userId;
    private String username;
    private String fullName;
    private String status; // SUCCESS, UNKNOWN, FAILURE
    private String message;
}
