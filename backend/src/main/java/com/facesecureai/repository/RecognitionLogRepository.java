package com.facesecureai.repository;

import com.facesecureai.model.RecognitionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RecognitionLogRepository extends JpaRepository<RecognitionLog, Long> {
    List<RecognitionLog> findTop50ByOrderByScanTimeDesc();
    List<RecognitionLog> findByScanTimeBetween(LocalDateTime start, LocalDateTime end);
    long countByScanTimeBetweenAndStatus(LocalDateTime start, LocalDateTime end, String status);
    long countByScanTimeBetween(LocalDateTime start, LocalDateTime end);
}
