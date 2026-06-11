package com.facesecureai.controller;

import com.facesecureai.dto.UserDto;
import com.facesecureai.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserDto userDto, Principal principal) {
        UserDto created = userService.createUser(userDto);
        userService.logAuditAction("USER_CREATE_API", principal.getName(), "API request to create user: " + created.getUsername());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUser(
            @PathVariable Long id, 
            @Valid @RequestBody UserDto userDto, 
            Principal principal) {
        UserDto updated = userService.updateUser(id, userDto);
        userService.logAuditAction("USER_UPDATE_API", principal.getName(), "API request to update user: " + updated.getUsername());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Principal principal) {
        UserDto target = userService.getUserById(id);
        userService.deleteUser(id);
        userService.logAuditAction("USER_DELETE_API", principal.getName(), "API request to delete user: " + target.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id, Principal principal) {
        // Simple security: users can only read their own details, admins can read anyone
        UserDto userDto = userService.getUserById(id);
        boolean isAdmin = principal != null && SecurityContextHolderHasAdminRole(principal);
        
        if (!isAdmin && !userDto.getUsername().equals(principal.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(userDto);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers(
            @RequestParam(value = "search", required = false) String search,
            Principal principal) {
        List<UserDto> users;
        if (search != null && !search.trim().isEmpty()) {
            users = userService.searchUsers(search.trim());
        } else {
            users = userService.getAllUsers();
        }
        return ResponseEntity.ok(users);
    }

    private boolean SecurityContextHolderHasAdminRole(Principal principal) {
        UserDto user = userService.getUserByUsername(principal.getName());
        return user.getRoles().contains("ROLE_ADMIN");
    }
}
