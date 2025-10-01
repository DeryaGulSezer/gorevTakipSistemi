package com.erdemirProje.gorevTakip.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/**
 * CORS (Cross-Origin Resource Sharing) konfigürasyon sınıfı
 * Angular frontend'in (localhost:4200) backend API'lerine erişimini sağlar
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /**
     * Global CORS konfigürasyonu
     * Tüm endpoint'ler için geçerli
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // Sadece /api ile başlayan endpoint'ler için
                .allowedOrigins(
                    "http://localhost:4200",    // Angular development server
                    "http://127.0.0.1:4200",   // Alternative localhost
                    "http://localhost:3000"     // React development server (gelecekte kullanım için)
                )
                .allowedMethods(
                    "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
                )
                .allowedHeaders(
                    "Origin", "Content-Type", "Accept", "Authorization", 
                    "Access-Control-Request-Method", "Access-Control-Request-Headers",
                    "X-Requested-With", "X-Auth-Token"
                )
                .exposedHeaders(
                    "Access-Control-Allow-Origin", "Access-Control-Allow-Credentials",
                    "Access-Control-Allow-Headers", "Access-Control-Allow-Methods"
                )
                .allowCredentials(true) // Cookie ve Authorization header'larını destekle
                .maxAge(3600); // Preflight request cache süresi (1 saat)
    }

    /**
     * Daha detaylı CORS konfigürasyonu için alternatif bean
     * Gerekirse bu bean'i aktif hale getirebilirsiniz
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // İzin verilen origin'ler
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://localhost:*"
        ));
        
        // İzin verilen HTTP metodları
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"
        ));
        
        // İzin verilen header'lar
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Credential'ları destekle
        configuration.setAllowCredentials(true);
        
        // Expose edilecek header'lar
        configuration.setExposedHeaders(Arrays.asList(
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers",
            "Access-Control-Max-Age",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        
        // Preflight cache süresi
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        
        return source;
    }
}