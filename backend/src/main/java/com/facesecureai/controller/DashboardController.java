package com.facesecureai.controller;

import com.facesecureai.dto.DashboardStatsDto;
import com.facesecureai.dto.RecognitionLogDto;
import com.facesecureai.model.AttendanceRecord;
import com.facesecureai.model.RecognitionLog;
import com.facesecureai.repository.AttendanceRecordRepository;
import com.facesecureai.repository.RecognitionLogRepository;
import com.facesecureai.repository.UserRepository;
import com.facesecureai.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private RecognitionLogRepository recognitionLogRepository;

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime dayStart = today.atStartOfDay();
        LocalDateTime dayEnd = today.atTime(23, 59, 59);

        // 1. Core Card Metrics
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findAll().stream().filter(u -> "ACTIVE".equals(u.getStatus())).count();
        long todayAttendance = attendanceRecordRepository.countByDate(today);
        long todayLate = attendanceRecordRepository.countByDateAndStatus(today, "LATE");
        long todayScans = recognitionLogRepository.countByScanTimeBetween(dayStart, dayEnd);
        
        long successScans = recognitionLogRepository.countByScanTimeBetweenAndStatus(dayStart, dayEnd, "SUCCESS");
        double accuracy = todayScans > 0 ? ((double) successScans / todayScans) * 100.0 : 100.0;
        accuracy = Math.round(accuracy * 10.0) / 10.0;

        // 2. Recent logs (last 10 events)
        List<RecognitionLogDto> recentLogs = recognitionLogRepository.findTop50ByOrderByScanTimeDesc().stream()
                .limit(10)
                .map(log -> RecognitionLogDto.builder()
                        .id(log.getId())
                        .matchedUserId(log.getMatchedUser() != null ? log.getMatchedUser().getId() : null)
                        .matchedUserFullName(log.getMatchedUser() != null ? log.getMatchedUser().getFullName() : "Unknown Face")
                        .matchedUsername(log.getMatchedUser() != null ? log.getMatchedUser().getUsername() : "unknown")
                        .confidence(log.getConfidence())
                        .snapshotPath(log.getSnapshotPath())
                        .status(log.getStatus())
                        .deviceInfo(log.getDeviceInfo())
                        .scanTime(log.getScanTime())
                        .build())
                .collect(Collectors.toList());

        // 3. Last 7 Days Attendance Trend
        Map<String, Long> trend = new LinkedHashMap<>();
        DateTimeFormatter trendFormatter = DateTimeFormatter.ofPattern("MM-dd");
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            long count = attendanceRecordRepository.countByDate(date);
            trend.put(date.format(trendFormatter), count);
        }

        // 4. Scan Type breakdowns
        Map<String, Long> scanBreakdown = new HashMap<>();
        scanBreakdown.put("SUCCESS", recognitionLogRepository.countByScanTimeBetweenAndStatus(dayStart, dayEnd, "SUCCESS"));
        scanBreakdown.put("UNKNOWN", recognitionLogRepository.countByScanTimeBetweenAndStatus(dayStart, dayEnd, "UNKNOWN"));
        scanBreakdown.put("FAILURE", recognitionLogRepository.countByScanTimeBetweenAndStatus(dayStart, dayEnd, "FAILURE"));

        DashboardStatsDto dto = DashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .todayAttendanceCount(todayAttendance)
                .todayLateCount(todayLate)
                .todayScansCount(todayScans)
                .todayAccuracyRate(accuracy)
                .recentLogs(recentLogs)
                .attendanceTrend(trend)
                .scanTypeCounts(scanBreakdown)
                .build();

        return ResponseEntity.ok(dto);
    }
}
