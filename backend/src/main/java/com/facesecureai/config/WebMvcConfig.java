package com.facesecureai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.storage.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Expose uploadDir directory to web clients under '/uploads/**'
        String absolutePath = new File(uploadDir).getAbsolutePath();
        String resourceLocation = "file:" + absolutePath + "/";
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }
}
