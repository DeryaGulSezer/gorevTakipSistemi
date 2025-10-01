package com.erdemirProje.gorevTakip.config;

import com.erdemirProje.gorevTakip.service.AuthService;
import com.erdemirProje.gorevTakip.service.GorevService;
import com.erdemirProje.gorevTakip.dto.GorevDto;
import com.erdemirProje.gorevTakip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {
    
    private final AuthService authService;
    private final GorevService gorevService;
    private final UserRepository userRepository;
    
    /**
     * Uygulama başlatıldığında default kullanıcıları ve demo görevleri oluştur
     */
    @Bean
    public ApplicationRunner initializeData() {
        return args -> {
            // Hiyerarşik kullanıcı sistemi oluştur
            authService.createDefaultDirector();  // 1. Direktör
            authService.createDefaultManager();   // 2. Müdür  
            authService.createDefaultTeamMember(); // 3. Ekip Üyesi
            
            // Demo görevleri oluştur
            createDemoTasks();
        };
    }
    
    /**
     * Demo görevleri oluştur
     */
    private void createDemoTasks() {
        // Demo görevler devre dışı - sıfırdan test için
        System.out.println("ℹ️ Demo görevler oluşturma devre dışı bırakıldı - sıfırdan test için");
        
        /*
        try {
            // Hiyerarşik kullanıcıları al
            var directorUser = userRepository.findByUsername("director");
            var managerUser = userRepository.findByUsername("manager");
            var teamMemberUser = userRepository.findByUsername("teammember");
            
            if (directorUser.isEmpty() || managerUser.isEmpty() || teamMemberUser.isEmpty()) {
                System.out.println("⚠️ Hiyerarşik kullanıcılar bulunamadı, demo görevler oluşturulamıyor");
                return;
            }
            
            Long directorId = directorUser.get().getId();
            Long managerId = managerUser.get().getId();
            Long teamMemberId = teamMemberUser.get().getId();
            
            // Direktör için stratejik görevler
            createTaskIfNotExists("Stratejik Planlama", "2024 yılı stratejik planını hazırla ve hedefleri belirle", directorId, "yüksek", "IN_PROGRESS");
            createTaskIfNotExists("Bütçe Yönetimi", "Departman bütçesini gözden geçir ve onaya hazırla", directorId, "yüksek", "PENDING");
            createTaskIfNotExists("Yönetici Toplantısı", "Aylık yönetici toplantısını organize et", directorId, "orta", "PENDING");
            
            // Müdür için yönetimsel görevler  
            createTaskIfNotExists("Ekip Performans Değerlendirmesi", "Ekip üyelerinin performansını değerlendir ve rapor hazırla", managerId, "yüksek", "IN_PROGRESS");
            createTaskIfNotExists("Project Management", "Aktif projelerin durumunu takip et ve direktöre rapor ver", managerId, "yüksek", "PENDING");
            createTaskIfNotExists("Ekip Eğitimi", "Ekip üyeleri için teknik eğitim programı organize et", managerId, "orta", "PENDING");
            createTaskIfNotExists("İnsan Kaynakları Koordinasyonu", "Yeni ekip üyesi alım sürecine destek ver", managerId, "orta", "COMPLETED");
            
            // Ekip üyesi için operasyonel görevler
            createTaskIfNotExists("Frontend Geliştirme", "Kullanıcı arayüzü geliştirmelerini tamamla", teamMemberId, "yüksek", "IN_PROGRESS");
            createTaskIfNotExists("API Entegrasyonu", "Backend servisleri ile frontend entegrasyonunu gerçekleştir", teamMemberId, "yüksek", "PENDING");
            createTaskIfNotExists("Unit Testing", "Geliştirilen modüller için unit testleri yaz", teamMemberId, "orta", "PENDING");
            createTaskIfNotExists("Code Review", "Diğer ekip üyelerinin kodlarını gözden geçir", teamMemberId, "orta", "COMPLETED");
            createTaskIfNotExists("Dokümantasyon", "Geliştirilen özelliklerin dokümantasyonunu hazırla", teamMemberId, "düşük", "COMPLETED");
            
            System.out.println("✅ Hiyerarşik demo görevler başarıyla oluşturuldu!");
            System.out.println("📊 Direktör: 3 görev, Müdür: 4 görev, Ekip Üyesi: 5 görev");
            
        } catch (Exception e) {
            System.out.println("⚠️ Demo görevler oluşturulurken hata: " + e.getMessage());
        }
        */
    }
    
    /**
     * Görev mevcut değilse oluştur
     */
    private void createTaskIfNotExists(String isim, String description, Long userid, String priority, String status) {
        try {
            GorevDto gorevDto = new GorevDto();
            gorevDto.setIsim(isim);
            gorevDto.setDescription(description);
            gorevDto.setUserid(userid);
            gorevDto.setPriority(priority);
            gorevDto.setStatus(status);
            
            gorevService.gorevEkle(gorevDto);
        } catch (Exception e) {
            // Görev zaten varsa veya hata olursa sessizce geç
            System.out.println("Info: '" + isim + "' görevi oluşturulamadı (muhtemelen zaten mevcut)");
        }
    }
}