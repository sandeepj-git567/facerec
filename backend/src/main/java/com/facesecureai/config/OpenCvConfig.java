package com.facesecureai.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class OpenCvConfig {

    private static boolean libraryLoaded = false;

    static {
        try {
            // Use OpenPNP to load system-specific OpenCV native binaries bundled in the jar
            nu.pattern.OpenCV.loadShared();
            libraryLoaded = true;
            log.info("==========================================================================");
            log.info("SUCCESS: OpenCV native binaries loaded successfully using OpenPNP!");
            log.info("==========================================================================");
        } catch (Throwable e) {
            log.warn("==========================================================================");
            log.warn("WARNING: OpenPNP failed to load OpenCV native library: {}", e.getMessage());
            log.warn("FaceSecureAI will start in MATHEMATICAL SIMULATION FALLBACK MODE.");
            log.warn("All image validations, facial embedding generations, and matching logics");
            log.warn("will run using stable mathematical hashing and similarity simulation.");
            log.warn("This guarantees compilation and system execution on developers' setups.");
            log.warn("==========================================================================");
            libraryLoaded = false;
        }
    }

    public static boolean isLibraryLoaded() {
        return libraryLoaded;
    }
}
