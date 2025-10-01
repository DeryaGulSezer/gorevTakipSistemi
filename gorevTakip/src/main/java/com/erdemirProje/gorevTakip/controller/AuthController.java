package com.erdemirProje.gorevTakip.controller;

import com.erdemirProje.gorevTakip.dto.*;
import com.erdemirProje.gorevTakip.entity.User;
import com.erdemirProje.gorevTakip.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200") // Angular frontend URL'i
public class AuthController {
    
    private final AuthService authService;
    
    /**
     * Kullanıcı girişi
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = authService.login(loginRequest);
            System.out.println("🔍 AuthController - Response: " + response);
            System.out.println("🔍 AuthController - Token: " + response.getToken());
            
            // Token varsa başarılı, yoksa hatalı
            if (response.getToken() != null) {
                System.out.println("✅ AuthController - Token mevcut, 200 OK dönüyor");
                return ResponseEntity.ok(response);
            } else {
                System.out.println("❌ AuthController - Token yok, 401 dönüyor");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
        } catch (Exception e) {
            System.out.println("💥 AuthController - Exception: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new LoginResponse("Sistem hatası oluştu!"));
        }
    }
    
    /**
     * Kullanıcı kaydı
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterRequest registerRequest) {
        try {
            LoginResponse response = authService.register(registerRequest);
            
            if (response.getToken() != null) {
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new LoginResponse("Sistem hatası oluştu!"));
        }
    }
    
    /**
     * Çıkış işlemi  
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String token) {
        try {
            // "Bearer " prefix'ini kaldır (frontend'den böyle gelecek)
            String cleanToken = token.replace("Bearer ", "");
            
            boolean success = authService.logout(cleanToken);
            
            if (success) {
                return ResponseEntity.ok("Çıkış başarılı");
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Geçersiz token");
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Çıkış işleminde hata oluştu");
        }
    }
    
    /**
     * Token doğrulama ve kullanıcı bilgisi
     * GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token.replace("Bearer ", "");
            
            Optional<User> userOptional = authService.getUserByToken(cleanToken);
            
            if (userOptional.isPresent()) {
                UserDto userDto = UserDto.fromEntity(userOptional.get());
                return ResponseEntity.ok(userDto);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Token geçerliliği kontrolü
     * GET /api/auth/validate
     */
    @GetMapping("/validate")
    public ResponseEntity<Boolean> validateToken(@RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token.replace("Bearer ", "");
            boolean isValid = authService.isTokenValid(cleanToken);
            
            return ResponseEntity.ok(isValid);
            
        } catch (Exception e) {
            return ResponseEntity.ok(false);
        }
    }
    
    /**
     * Kullanıcının admin olup olmadığını kontrol et
     * GET /api/auth/is-admin
     */
    @GetMapping("/is-admin")
    public ResponseEntity<Boolean> isAdmin(@RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token.replace("Bearer ", "");
            boolean isAdmin = authService.isAdmin(cleanToken);
            
            return ResponseEntity.ok(isAdmin);
            
        } catch (Exception e) {
            return ResponseEntity.ok(false);
        }
    }
    
    /**
     * Tüm aktif kullanıcıları listele (admin yetkisi gerekli)
     * GET /api/auth/users
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers(@RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token.replace("Bearer ", "");
            
            // Admin kontrolü
            if (!authService.isAdmin(cleanToken)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            List<UserDto> users = authService.getAllActiveUsers();
            return ResponseEntity.ok(users);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}