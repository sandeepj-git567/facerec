package com.facesecureai.service;

import com.facesecureai.dto.UserDto;
import com.facesecureai.model.User;

import java.util.List;

public interface UserService {
    UserDto createUser(UserDto userDto);
    UserDto updateUser(Long id, UserDto userDto);
    void deleteUser(Long id);
    UserDto getUserById(Long id);
    User getUserEntityById(Long id);
    UserDto getUserByUsername(String username);
    List<UserDto> searchUsers(String query);
    List<UserDto> getAllUsers();

    // Audit Logging utility
    void logAuditAction(String action, String performedBy, String details);
}
