package com.facesecureai.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {
    private long totalUsers;
    private long activeUsers;
    private long todayAttendanceCount;
    private long todayLateCount;
    private long todayScansCount;
    private double todayAccuracyRate; // derived from successful vs unknown logs
    
    private List<RecognitionLogDto> recentLogs;
    private Map<String, Long> attendanceTrend; // Date -> Count mapping
    private Map<String, Long> scanTypeCounts; // e.g. "SUCCESS" -> Count, "UNKNOWN" -> Count
}
