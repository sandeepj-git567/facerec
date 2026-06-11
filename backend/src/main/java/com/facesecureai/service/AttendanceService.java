package com.facesecureai.service;

import com.facesecureai.model.AttendanceRecord;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AttendanceService {
    String markAttendance(Long userId);
    List<AttendanceRecord> getAttendanceHistory(Long userId);
    List<AttendanceRecord> getAttendanceByDateRange(LocalDate start, LocalDate end);
    List<AttendanceRecord> getAttendanceByUserIdAndDateRange(Long userId, LocalDate start, LocalDate end);
    Map<String, Object> getAttendanceAnalytics();
}
