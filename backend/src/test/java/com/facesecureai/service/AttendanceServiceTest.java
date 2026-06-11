package com.facesecureai.service;

import com.facesecureai.model.AttendanceRecord;
import com.facesecureai.model.User;
import com.facesecureai.repository.AttendanceRecordRepository;
import com.facesecureai.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AttendanceServiceTest {

    @Mock
    private AttendanceRecordRepository attendanceRecordRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AttendanceServiceImpl attendanceService;

    private User sampleUser;

    @BeforeEach
    public void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .username("john_doe")
                .firstName("John")
                .lastName("Doe")
                .email("john@example.com")
                .status("ACTIVE")
                .build();
    }

    @Test
    public void testMarkAttendanceNewClockIn() {
        // Mocking: User exists, but has no record today
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(attendanceRecordRepository.findByUserIdAndDate(1L, LocalDate.now()))
                .thenReturn(Optional.empty());
        when(attendanceRecordRepository.save(any(AttendanceRecord.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Execute
        String status = attendanceService.markAttendance(1L);

        // Assert
        assertTrue(status.startsWith("CLOCKED_IN"), "First scan must clock-in the user");
        verify(attendanceRecordRepository, times(1)).save(any(AttendanceRecord.class));
    }

    @Test
    public void testMarkAttendanceClockOut() {
        // Mocking: User has already checked in today
        AttendanceRecord existingRecord = AttendanceRecord.builder()
                .id(100L)
                .user(sampleUser)
                .date(LocalDate.now())
                .clockIn(LocalDateTime.now().minusHours(8))
                .status("PRESENT")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(attendanceRecordRepository.findByUserIdAndDate(1L, LocalDate.now()))
                .thenReturn(Optional.of(existingRecord));
        when(attendanceRecordRepository.save(any(AttendanceRecord.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Execute
        String status = attendanceService.markAttendance(1L);

        // Assert
        assertEquals("CLOCKED_OUT", status, "Second scan must clock-out the user");
        assertNotNull(existingRecord.getClockOut(), "Clock out time must be filled");
    }
}
