package com.erdemirProje.gorevTakip.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.ToString;

import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "gorevler") // Circular reference'ı önlemek için
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String email;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.TEAM_MEMBER;
    
    @Column(name = "full_name")
    private String fullName;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "manager_type")
    private String managerType; // "Satış Müdürü", "Yazılım Müdürü" vb.
    
    // User'ın görevleri (One-to-Many relationship)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<GorevYapisi> gorevler;
    
    // Hiyerarşik yapı - Müdür ilişkisi
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager; // Bu kullanıcının müdürü
    
    // Bu kullanıcının yönettiği ekip üyeleri
    @OneToMany(mappedBy = "manager", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<User> teamMembers;
    
    /**
     * Kullanıcı rolleri - Hiyerarşik Sistem
     */
    public enum Role {
        DIRECTOR,    // Direktör - En üst seviye, tüm yetkiler
        MANAGER,     // Müdür - Ekip üyelerini yönetir, direktöre rapor verir
        TEAM_MEMBER  // Ekip Üyesi - Sadece kendi görevlerini görür
    }
    
    // Convenience methods
    public boolean isDirector() {
        return Role.DIRECTOR.equals(this.role);
    }
    
    public boolean isManager() {
        return Role.MANAGER.equals(this.role);
    }
    
    public boolean isTeamMember() {
        return Role.TEAM_MEMBER.equals(this.role);
    }
    
    public boolean hasManagementRole() {
        return isDirector() || isManager();
    }
    
    // Backward compatibility (geçici)
    public boolean isAdmin() {
        return isDirector();
    }
    
    public boolean isUser() {
        return isTeamMember();
    }
}