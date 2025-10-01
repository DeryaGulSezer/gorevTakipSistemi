package com.erdemirProje.gorevTakip.dto;

import com.erdemirProje.gorevTakip.entity.User;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String fullName;
    private User.Role role = User.Role.TEAM_MEMBER; // Default olarak TEAM_MEMBER rolü
    private String managerType; // Müdür tipi (MANAGER rolü için)
    private Long managerId; // Ekip üyesi oluşturulurken atanacak müdür
}