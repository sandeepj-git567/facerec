package com.facesecureai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.beans.factory.annotation.Value;
import java.io.File;
import lombok.extern.slf4j.Slf4j;

@SpringBootApplication
@Slf4j
public class FaceSecureAiApplication {

    @Value("${app.storage.faces-dir}")
    private String facesDir;

    @Value("${app.storage.snapshots-dir}")
    private String snapshotsDir;

    public static void main(String[] presumption) {
        SpringApplication.run(FaceSecureAiApplication.class, presumption);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initStorageDirectories() {
        log.info("Initializing system storage directories...");
        createDir(facesDir);
        createDir(snapshotsDir);
    }

    private void createDir(String path) {
        File directory = new File(path);
        if (!directory.exists()) {
            if (directory.mkdirs()) {
                log.info("Successfully created storage directory: {}", path);
            } else {
                log.error("Failed to create storage directory: {}", path);
            }
        } else {
            log.info("Storage directory already exists: {}", path);
        }
    }
}
