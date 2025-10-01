package com.erdemirProje.gorevTakip.dto;

import com.erdemirProje.gorevTakip.entity.User;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private User.Role role;
    private Boolean isActive;
    private String managerType; // Müdür tipi
    private Long managerId; // Hiyerarşik yapı için
    
    // Entity'den DTO'ya dönüştürme constructor'ı
    public UserDto(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.role = user.getRole();
        this.isActive = user.getIsActive();
        this.managerType = user.getManagerType();
        this.managerId = user.getManager() != null ? user.getManager().getId() : null;
    }
    
    // Static factory method - Entity'den DTO oluşturma
    public static UserDto fromEntity(User user) {
        return new UserDto(user);
    }
    
    // Güvenlik için - şifre bilgisi burada yok
}