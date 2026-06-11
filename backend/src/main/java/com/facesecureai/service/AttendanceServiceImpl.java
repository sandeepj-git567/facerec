package com.facesecureai.service;

import com.facesecureai.exception.ResourceNotFoundException;
import com.facesecureai.model.AttendanceRecord;
import com.facesecureai.model.User;
import com.facesecureai.repository.AttendanceRecordRepository;
import com.facesecureai.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@Slf4j
public class AttendanceServiceImpl implements AttendanceService {

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private UserRepository userRepository;

    // Define late cutoff time as 09:00 AM
    private static final LocalTime LATE_THRESHOLD = LocalTime.of(9, 0);

    @Override
    public String markAttendance(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        
        Optional<AttendanceRecord> existingRecord = attendanceRecordRepository.findByUserIdAndDate(userId, today);
        
        if (existingRecord.isPresent()) {
            // Clock-out scenario: update clockOut to the latest scan time
            AttendanceRecord record = existingRecord.get();
            record.setClockOut(now);
            
            // Check if they clocked out early (before 5:00 PM)
            if (now.toLocalTime().isBefore(LocalTime.of(17, 0)) && !"LATE".equals(record.getStatus())) {
                record.setStatus("EARLY_DEPART");
            }
            
            attendanceRecordRepository.save(record);
            log.info("User {} clocked out at {}", user.getUsername(), now);
            return "CLOCKED_OUT";
        } else {
            // Clock-in scenario: check if late
            String status = "PRESENT";
            if (now.toLocalTime().isAfter(LATE_THRESHOLD)) {
                status = "LATE";
            }
            
            AttendanceRecord record = AttendanceRecord.builder()
                    .user(user)
                    .date(today)
                    .clockIn(now)
                    .status(status)
                    .build();
            
            attendanceRecordRepository.save(record);
            log.info("User {} clocked in at {}, status: {}", user.getUsername(), now, status);
            return "CLOCKED_IN (" + status + ")";
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRecord> getAttendanceHistory(Long userId) {
        return attendanceRecordRepository.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRecord> getAttendanceByDateRange(LocalDate start, LocalDate end) {
        return attendanceRecordRepository.findByDateBetween(start, end);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRecord> getAttendanceByUserIdAndDateRange(Long userId, LocalDate start, LocalDate end) {
        return attendanceRecordRepository.findByUserIdAndDateBetween(userId, start, end);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAttendanceAnalytics() {
        LocalDate today = LocalDate.now();
        long totalActiveUsers = userRepository.findAll().stream()
                .filter(u -> "ACTIVE".equals(u.getStatus()))
                .count();

        long todayPresent = attendanceRecordRepository.countByDateAndStatus(today, "PRESENT");
        long todayLate = attendanceRecordRepository.countByDateAndStatus(today, "LATE");
        long todayEarlyDepart = attendanceRecordRepository.countByDateAndStatus(today, "EARLY_DEPART");
        long todayTotalCheckedIn = attendanceRecordRepository.countByDate(today);
        long todayAbsent = Math.max(0, totalActiveUsers - todayTotalCheckedIn);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalActiveUsers", totalActiveUsers);
        stats.put("present", todayPresent);
        stats.put("late", todayLate);
        stats.put("earlyDepart", todayEarlyDepart);
        stats.put("absent", todayAbsent);
        stats.put("totalCheckedIn", todayTotalCheckedIn);

        // Daily rates
        double attendanceRate = totalActiveUsers > 0 ? ((double) todayTotalCheckedIn / totalActiveUsers) * 100.0 : 0.0;
        stats.put("attendanceRate", Math.round(attendanceRate * 10.0) / 10.0);

        return stats;
    }
}
