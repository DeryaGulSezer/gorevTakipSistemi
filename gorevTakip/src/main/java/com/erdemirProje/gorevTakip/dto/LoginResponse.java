package com.erdemirProje.gorevTakip.dto;

import com.erdemirProje.gorevTakip.entity.User;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private User.Role role;
    private String token; // Basit token (session id olarak kullanılacak)
    private String message;
    
    // Success response constructor
    public LoginResponse(Long userId, String username, String email, String fullName, User.Role role, String token) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.token = token;
        this.message = "Giriş başarılı";
    }
    
    // Error response constructor
    public LoginResponse(String message) {
        this.message = message;
    }
}