package com.facesecureai.controller;

import com.facesecureai.dto.UserDto;
import com.facesecureai.model.AttendanceRecord;
import com.facesecureai.service.AttendanceService;
import com.facesecureai.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private UserService userService;

    @PostMapping("/mark")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> forceMarkAttendance(
            @RequestParam Long userId, 
            Principal principal) {
        String result = attendanceService.markAttendance(userId);
        userService.logAuditAction("ATTENDANCE_FORCE_MARK", principal.getName(), "Manually marked attendance for user ID: " + userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", result);
        response.put("message", "Attendance marked successfully! Status: " + result);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<List<AttendanceRecord>> getUserHistory(@PathVariable Long userId, Principal principal) {
        UserDto userDto = userService.getUserById(userId);
        boolean isAdmin = SecurityContextHolderHasAdminRole(principal);
        
        if (!isAdmin && !userDto.getUsername().equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<AttendanceRecord> history = attendanceService.getAttendanceHistory(userId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AttendanceRecord>> getAttendanceList(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long userId) {
        
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        
        List<AttendanceRecord> records;
        if (userId != null) {
            records = attendanceService.getAttendanceByUserIdAndDateRange(userId, start, end);
        } else {
            records = attendanceService.getAttendanceByDateRange(start, end);
        }
        
        return ResponseEntity.ok(records);
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAnalyticsSummary() {
        return ResponseEntity.ok(attendanceService.getAttendanceAnalytics());
    }

    private boolean SecurityContextHolderHasAdminRole(Principal principal) {
        UserDto user = userService.getUserByUsername(principal.getName());
        return user.getRoles().contains("ROLE_ADMIN");
    }
}
