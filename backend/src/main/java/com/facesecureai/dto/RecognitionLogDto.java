package com.facesecureai.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecognitionLogDto {
    private Long id;
    private Long matchedUserId;
    private String matchedUserFullName;
    private String matchedUsername;
    private Double confidence;
    private String snapshotPath;
    private String status;
    private String deviceInfo;
    private LocalDateTime scanTime;
}
