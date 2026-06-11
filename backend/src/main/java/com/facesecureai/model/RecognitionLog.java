package com.facesecureai.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recognition_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecognitionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "matched_user_id")
    private User matchedUser; // Null if face is unrecognized

    @Column(nullable = false)
    private Double confidence; // e.g. 98.4

    @Column(name = "snapshot_path")
    private String snapshotPath; // File path of the check-in photo

    @Column(nullable = false, length = 20)
    private String status; // SUCCESS, UNKNOWN, FAILURE

    @Column(name = "device_info", length = 100)
    private String deviceInfo; // Camera location/identifier

    @Column(name = "scan_time", updatable = false)
    private LocalDateTime scanTime;

    @PrePersist
    protected void onCreate() {
        scanTime = LocalDateTime.now();
    }
}
