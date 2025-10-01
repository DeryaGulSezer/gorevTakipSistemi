package com.erdemirProje.gorevTakip.service;

import com.erdemirProje.gorevTakip.dto.GorevDto;
import com.erdemirProje.gorevTakip.entity.GorevYapisi;
import com.erdemirProje.gorevTakip.gorevRepo.GorevYapisiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserGorevService {
    
    private final GorevYapisiRepository gorevRepository;
    
    /**
     * Kullanıcının tüm görevlerini öncelik sırasına göre getir
     * @param userid Kullanıcı ID'si
     * @return Öncelik sırasına göre sıralanmış görev listesi
     */
    public List<GorevDto> getUserTasksOrderedByPriority(Long userid) {
        try {
            List<GorevYapisi> gorevListesi = gorevRepository.findByUseridOrderedByPriority(userid);
            return gorevListesi.stream()
                    .map(GorevDto::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of(); // Hata durumunda boş liste döndür
        }
    }
    
    /**
     * Kullanıcının aktif (tamamlanmamış) görevlerini öncelik sırasına göre getir
     * @param userid Kullanıcı ID'si
     * @return Aktif görevlerin öncelik sırasına göre listesi
     */
    public List<GorevDto> getUserActiveTasksOrderedByPriority(Long userid) {
        try {
            List<GorevYapisi> gorevListesi = gorevRepository.findActiveTasksByUseridOrderedByPriority(userid);
            return gorevListesi.stream()
                    .map(GorevDto::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }
    
    /**
     * Kullanıcının belirli status'teki görevlerini getir
     * @param userid Kullanıcı ID'si
     * @param status Görev durumu (PENDING, IN_PROGRESS, COMPLETED)
     * @return Belirtilen status'teki görevler
     */
    public List<GorevDto> getUserTasksByStatus(Long userid, String status) {
        try {
            List<GorevYapisi> gorevListesi = gorevRepository.findByUserIdAndStatus(userid, status);
            return gorevListesi.stream()
                    .map(GorevDto::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }
    
    /**
     * Görevi tamamlandı olarak işaretle
     * @param gorevId Görev ID'si
     * @param userid Kullanıcı ID'si (yetki kontrolü için)
     * @return İşlem başarılı mı
     */
    public boolean markTaskAsCompleted(Long gorevId, Long userid) {
        try {
            Optional<GorevYapisi> gorevOptional = gorevRepository.findById(gorevId);
            
            if (gorevOptional.isPresent()) {
                GorevYapisi gorev = gorevOptional.get();
                
                // Kullanıcı yetki kontrolü - sadece kendi görevini tamamlayabilir
                if (!gorev.getUserid().equals(userid)) {
                    return false; // Yetkisiz erişim
                }
                
                gorev.setStatus("COMPLETED");
                gorevRepository.save(gorev);
                return true;
            }
            return false; // Görev bulunamadı
        } catch (Exception e) {
            return false; // İşlem başarısız
        }
    }
    
    /**
     * Görev durumunu güncelle
     * @param gorevId Görev ID'si
     * @param userid Kullanıcı ID'si (yetki kontrolü için)
     * @param newStatus Yeni durum
     * @return İşlem başarılı mı
     */
    public boolean updateTaskStatus(Long gorevId, Long userid, String newStatus) {
        try {
            Optional<GorevYapisi> gorevOptional = gorevRepository.findById(gorevId);
            
            if (gorevOptional.isPresent()) {
                GorevYapisi gorev = gorevOptional.get();
                
                // Kullanıcı yetki kontrolü
                if (!gorev.getUserid().equals(userid)) {
                    return false;
                }
                
                // Geçerli status değerlerini kontrol et
                if (!isValidStatus(newStatus)) {
                    return false;
                }
                
                gorev.setStatus(newStatus);
                gorevRepository.save(gorev);
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Kullanıcının görev istatistiklerini getir
     * @param userid Kullanıcı ID'si
     * @return İstatistik bilgileri
     */
    public UserTaskStats getUserTaskStats(Long userid) {
        try {
            Long totalTasks = gorevRepository.countGorevlerByUserid(userid);
            Long completedTasks = gorevRepository.countCompletedTasksByUserid(userid);
            Long activeTasks = gorevRepository.countActiveTasksByUserid(userid);
            
            return new UserTaskStats(totalTasks, activeTasks, completedTasks);
        } catch (Exception e) {
            return new UserTaskStats(0L, 0L, 0L);
        }
    }
    
    /**
     * Status değerinin geçerli olup olmadığını kontrol et
     */
    private boolean isValidStatus(String status) {
        return status != null && 
               (status.equals("PENDING") || 
                status.equals("IN_PROGRESS") || 
                status.equals("COMPLETED"));
    }
    
    /**
     * Kullanıcı görev istatistikleri için inner class
     */
    public static class UserTaskStats {
        private Long totalTasks;
        private Long activeTasks;
        private Long completedTasks;
        
        public UserTaskStats(Long totalTasks, Long activeTasks, Long completedTasks) {
            this.totalTasks = totalTasks;
            this.activeTasks = activeTasks;
            this.completedTasks = completedTasks;
        }
        
        // Getters
        public Long getTotalTasks() { return totalTasks; }
        public Long getActiveTasks() { return activeTasks; }
        public Long getCompletedTasks() { return completedTasks; }
        
        // Setters
        public void setTotalTasks(Long totalTasks) { this.totalTasks = totalTasks; }
        public void setActiveTasks(Long activeTasks) { this.activeTasks = activeTasks; }
        public void setCompletedTasks(Long completedTasks) { this.completedTasks = completedTasks; }
    }
}