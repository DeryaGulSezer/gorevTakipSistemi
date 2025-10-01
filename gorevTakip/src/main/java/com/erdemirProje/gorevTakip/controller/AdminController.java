package com.erdemirProje.gorevTakip.controller;

import com.erdemirProje.gorevTakip.dto.GorevDto;
import com.erdemirProje.gorevTakip.dto.RegisterRequest;
import com.erdemirProje.gorevTakip.dto.UserDto;
import com.erdemirProje.gorevTakip.entity.GorevYapisi;
import com.erdemirProje.gorevTakip.gorevRepo.GorevYapisiRepository;
import com.erdemirProje.gorevTakip.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AdminController {

    private final AuthService authService;
    private final GorevYapisiRepository gorevRepository;

    /**
     * Yeni kullanıcı oluştur (Admin Only)
     * POST /api/admin/users
     */
    @PostMapping("/users")
    public ResponseEntity<UserDto> createUser(@RequestBody RegisterRequest request) {
        try {
            UserDto newUser = authService.registerForAdmin(request);
            if (newUser != null) {
                return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
            } else {
                return ResponseEntity.status(HttpStatus.CONFLICT).build(); // Kullanıcı adı zaten mevcut
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Tüm kullanıcıları listele (Admin Only)
     * GET /api/admin/users
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        try {
            List<UserDto> users = authService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Kullanıcı bilgilerini getir (Admin Only)
     * GET /api/admin/users/{id}
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        try {
            var user = authService.findById(id);
            if (user.isPresent()) {
                UserDto userDto = UserDto.fromEntity(user.get());
                return ResponseEntity.ok(userDto);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Kullanıcıyı sil (Admin Only)
     * DELETE /api/admin/users/{id}
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        try {
            boolean success = authService.deleteUser(id);
            if (success) {
                return ResponseEntity.ok("Kullanıcı başarıyla silindi.");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Kullanıcı bulunamadı.");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Kullanıcı silinirken bir hata oluştu.");
        }
    }

    /**
     * Kullanıcı bilgilerini güncelle (Admin Only)
     * PUT /api/admin/users/{id}
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
        try {
            UserDto updatedUser = authService.updateUser(id, request);
            if (updatedUser != null) {
                return ResponseEntity.ok(updatedUser);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Kullanıcı güncelleme için request body sınıfı
     */
    public static class UserUpdateRequest {
        private String username;
        private String email;
        private String fullName;
        private String role; // "ADMIN" veya "USER"
        private String managerType; // Müdür tipi
        private Boolean isActive;
            private Long managerId; // Müdüre atama

        // Constructors
        public UserUpdateRequest() {}

        // Getters and Setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getManagerType() { return managerType; }
        public void setManagerType(String managerType) { this.managerType = managerType; }

        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }

            public Long getManagerId() { return managerId; }
            public void setManagerId(Long managerId) { this.managerId = managerId; }
    }

    /**
     * Tüm müdürleri getir (ekip üyesi atarken kullanmak için)
     * GET /api/admin/managers
     */
    @GetMapping("/managers")
    public ResponseEntity<List<UserDto>> getAllManagers() {
        try {
            List<UserDto> managers = authService.getAllManagersForAdmin();
            return ResponseEntity.ok(managers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Direktöre rapor edilen görevleri getir
     */
    @GetMapping("/reported-tasks")
    public ResponseEntity<List<GorevDto>> getReportedTasks() {
        try {
            List<GorevYapisi> reportedTasks = gorevRepository.findReportedToDirector();
            List<GorevDto> taskDtos = reportedTasks.stream()
                    .map(GorevDto::fromEntity)
                    .collect(Collectors.toList());
            
            System.out.println("📊 Direktör: " + taskDtos.size() + " rapor edilen görev getiriliyor");
            return ResponseEntity.ok(taskDtos);
        } catch (Exception e) {
            System.out.println("❌ Rapor edilen görevler getirilirken hata: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}