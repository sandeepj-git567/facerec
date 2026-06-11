package com.facesecureai.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.UUID;

@Component
@Slf4j
public class FileStorageUtils {

    /**
     * Decodes and saves a base64 image string to disk.
     * Returns the relative path to be stored in the database.
     */
    public String saveBase64Image(String base64Image, String targetDirectory, String filePrefix) throws IOException {
        // Remove metadata prefix if present (e.g., "data:image/jpeg;base64,")
        String cleanBase64 = base64Image;
        String extension = ".jpg"; // Default extension

        if (base64Image.contains(",")) {
            String header = base64Image.substring(0, base64Image.indexOf(","));
            cleanBase64 = base64Image.substring(base64Image.indexOf(",") + 1);
            
            if (header.contains("png")) {
                extension = ".png";
            } else if (header.contains("gif")) {
                extension = ".gif";
            }
        }

        byte[] imageBytes = Base64.getDecoder().decode(cleanBase64.trim());

        // Ensure target directory exists
        File dir = new File(targetDirectory);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String fileName = filePrefix + "_" + UUID.randomUUID().toString() + extension;
        File targetFile = new File(dir, fileName);

        try (FileOutputStream fos = new FileOutputStream(targetFile)) {
            fos.write(imageBytes);
        }

        log.info("Saved image to: {}", targetFile.getAbsolutePath());
        
        // Return standard path representation for resource matching
        return fileName;
    }
}
