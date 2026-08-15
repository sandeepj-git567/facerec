package com.facesecureai.controller;

import com.facesecureai.dto.JwtResponse;
import com.facesecureai.dto.LoginRequest;
import com.facesecureai.dto.UserDto;
import com.facesecureai.service.UserService;
import com.facesecureai.util.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        // Log authorization audit trail
        userService.logAuditAction("LOGIN_SUCCESS", userDetails.getUsername(), "User logged in successfully");

        return ResponseEntity.ok(new JwtResponse(jwt, userDetails.getUsername(), roles));
    }

    @Autowired
    private com.facesecureai.service.FaceService faceService;

    @Autowired
    private UserDetailsService userDetailsService;

    @PostMapping("/face-login")
    public ResponseEntity<?> authenticateWithFace(@Valid @RequestBody com.facesecureai.dto.RecognitionRequest recognitionRequest) {
        com.facesecureai.dto.FaceMatchResult result = faceService.recognizeFace(recognitionRequest);
        if (!result.isMatched()) {
            return ResponseEntity.status(401).body(java.util.Map.of("message", "Face not recognized. " + result.getMessage()));
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(result.getUsername());
        Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        userService.logAuditAction("FACE_LOGIN_SUCCESS", userDetails.getUsername(), "User logged in with face biometrics");

        return ResponseEntity.ok(new JwtResponse(jwt, userDetails.getUsername(), roles));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserDto userDto = userService.getUserByUsername(principal.getName());
        return ResponseEntity.ok(userDto);
    }
}
