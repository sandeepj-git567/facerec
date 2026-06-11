package com.facesecureai.service;

import com.facesecureai.dto.UserDto;
import com.facesecureai.exception.ResourceNotFoundException;
import com.facesecureai.model.AuditLog;
import com.facesecureai.model.Role;
import com.facesecureai.model.User;
import com.facesecureai.repository.AuditLogRepository;
import com.facesecureai.repository.RoleRepository;
import com.facesecureai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDto createUser(UserDto userDto) {
        if (userRepository.existsByUsername(userDto.getUsername())) {
            throw new IllegalArgumentException("Username is already taken!");
        }
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        Set<Role> roles = new HashSet<>();
        if (userDto.getRoles() == null || userDto.getRoles().isEmpty()) {
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Error: Role ROLE_USER is not found."));
            roles.add(userRole);
        } else {
            userDto.getRoles().forEach(roleName -> {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Error: Role " + roleName + " is not found."));
                roles.add(role);
            });
        }

        User user = User.builder()
                .username(userDto.getUsername())
                .password(passwordEncoder.encode(userDto.getPassword()))
                .email(userDto.getEmail())
                .firstName(userDto.getFirstName())
                .lastName(userDto.getLastName())
                .phone(userDto.getPhone())
                .status("ACTIVE")
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);
        
        logAuditAction("USER_CREATE", "ADMIN", "Created user: " + savedUser.getUsername());
        
        return convertToDto(savedUser);
    }

    @Override
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setEmail(userDto.getEmail());
        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        user.setPhone(userDto.getPhone());
        
        if (userDto.getStatus() != null) {
            user.setStatus(userDto.getStatus());
        }

        if (userDto.getRoles() != null && !userDto.getRoles().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            userDto.getRoles().forEach(roleName -> {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Error: Role " + roleName + " is not found."));
                roles.add(role);
            });
            user.setRoles(roles);
        }

        User updatedUser = userRepository.save(user);
        
        logAuditAction("USER_UPDATE", "ADMIN", "Updated user: " + updatedUser.getUsername());
        
        return convertToDto(updatedUser);
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        String username = user.getUsername();
        userRepository.delete(user);
        
        logAuditAction("USER_DELETE", "ADMIN", "Deleted user: " + username);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return convertToDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return convertToDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> searchUsers(String query) {
        return userRepository.searchUsers(query).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public void logAuditAction(String action, String performedBy, String details) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .performedBy(performedBy)
                .details(details)
                .build();
        auditLogRepository.save(auditLog);
    }

    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .status(user.getStatus())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .build();
    }
}
