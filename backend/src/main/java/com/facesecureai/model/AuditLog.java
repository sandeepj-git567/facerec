package com.facesecureai.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String action; // e.g. USER_CREATE, USER_DELETE, EXPORT_EXCEL

    @Column(name = "performed_by", nullable = false, length = 50)
    private String performedBy; // Username of administrator or SYSTEM

    @Column(columnDefinition = "TEXT")
    private String details; // Action metadata (JSON or custom text)

    @Column(updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
