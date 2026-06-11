package com.facesecureai.controller;

import com.facesecureai.dto.EnrollmentRequest;
import com.facesecureai.dto.FaceMatchResult;
import com.facesecureai.dto.RecognitionRequest;
import com.facesecureai.service.FaceService;
import com.facesecureai.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/faces")
public class FaceController {

    @Autowired
    private FaceService faceService;

    @Autowired
    private UserService userService;

    @PostMapping("/enroll")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> enrollUser(@Valid @RequestBody EnrollmentRequest request, Principal principal) {
        faceService.enrollUser(request);
        userService.logAuditAction("FACE_ENROLL", principal.getName(), "Enrolled biometric template for user ID: " + request.getUserId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "User biometric templates registered successfully!");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/recognize")
    public ResponseEntity<FaceMatchResult> recognizeFace(@Valid @RequestBody RecognitionRequest request, Principal principal) {
        FaceMatchResult result = faceService.recognizeFace(request);
        
        // Log transaction
        String performer = principal != null ? principal.getName() : "TERMINAL_SCANNER";
        if (result.isMatched()) {
            userService.logAuditAction("FACE_RECOGNIZE_MATCH", performer, "Face match succeeded for: " + result.getUsername());
        } else {
            userService.logAuditAction("FACE_RECOGNIZE_MISMATCH", performer, "Face match failed. Result: " + result.getStatus());
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/registered/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> checkRegistration(@PathVariable Long userId) {
        boolean registered = faceService.hasFaceRegistered(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("registered", registered);
        return ResponseEntity.ok(response);
    }
}
