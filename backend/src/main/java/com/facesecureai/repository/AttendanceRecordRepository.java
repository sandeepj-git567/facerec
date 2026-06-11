package com.facesecureai.repository;

import com.facesecureai.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    Optional<AttendanceRecord> findByUserIdAndDate(Long userId, LocalDate date);
    List<AttendanceRecord> findByDate(LocalDate date);
    List<AttendanceRecord> findByUserId(Long userId);
    List<AttendanceRecord> findByDateBetween(LocalDate startDate, LocalDate endDate);
    List<AttendanceRecord> findByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
    
    long countByDateAndStatus(LocalDate date, String status);
    long countByDate(LocalDate date);
}
