package com.erdemirProje.gorevTakip.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String usernameOrEmail; // Username veya email ile giriş
    private String password;
}