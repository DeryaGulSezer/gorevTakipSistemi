package com.erdemirProje.gorevTakip.service;

import com.erdemirProje.gorevTakip.dto.GorevDto;
import com.erdemirProje.gorevTakip.entity.GorevYapisi;
import com.erdemirProje.gorevTakip.gorevRepo.GorevYapisiRepository;
import com.erdemirProje.gorevTakip.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GorevService {
    
    private final GorevYapisiRepository gorevRepository;
    
    /**
     * Yeni görev ekleme işlemi
     * @param gorevDto Eklenecek görev bilgileri
     * @return Eklenen görevin DTO'su
     */
    public GorevDto gorevEkle(GorevDto gorevDto) {
        // DTO'yu Entity'ye dönüştür
        GorevYapisi yeniGorev = gorevDto.toEntity();
        
        // Yeni görev için default status
        if (yeniGorev.getStatus() == null || yeniGorev.getStatus().isEmpty()) {
            yeniGorev.setStatus("PENDING");
        }
        
        // Kapsülleme: atayan kullanıcı (direktör veya müdür) bilgisi DTO'dan gelirse bağla
        //yönetici tarafından e
        if (gorevDto.getAssignedById() != null) {
            User atayan = new User();
            atayan.setId(gorevDto.getAssignedById());
            yeniGorev.setAssignedBy(atayan);
        }
        // Parent görev gönderildiyse setle
        if (gorevDto.getParentTaskId() != null) {
            GorevYapisi parent = new GorevYapisi();
            parent.setGorevid(gorevDto.getParentTaskId());
            yeniGorev.setParentTask(parent);
        }

        // Veritabanına kaydet
        GorevYapisi kaydedilenGorev = gorevRepository.save(yeniGorev);
        
        // Kaydedilen entity'yi DTO'ya dönüştürüp geri döndür
        return GorevDto.fromEntity(kaydedilenGorev);
    }
    
    /**
     * Görev silme işlemi
     * @param gorevId Silinecek görevin ID'si
     * @return Silme işlemi başarılı mı
     */
    public boolean gorevSil(Long gorevId) {
        try {
            // Görevin var olup olmadığını kontrol et
            if (gorevRepository.existsById(gorevId)) {
                gorevRepository.deleteById(gorevId);
                return true;
            }
            return false; // Görev bulunamadı
        } catch (Exception e) {
            return false; // Silme işlemi başarısız
        }
    }
    
    /**
     * Görev güncelleme işlemi (Partial Update destekli)
     * @param gorevId Güncellenecek görevin ID'si
     * @param gorevDto Güncellenecek görev bilgileri (null olan alanlar değiştirilmez)
     * @return Güncellenen görevin DTO'su, bulunamazsa null
     */
    public GorevDto gorevGuncelle(Long gorevId, GorevDto gorevDto) {
        try {
            // Mevcut görevi veritabanından getir
            var mevcutGorevOptional = gorevRepository.findById(gorevId);
            
            if (mevcutGorevOptional.isPresent()) {
                GorevYapisi mevcutGorev = mevcutGorevOptional.get();
                
                // Sadece null olmayan alanları güncelle
                if (gorevDto.getIsim() != null) {
                    mevcutGorev.setIsim(gorevDto.getIsim());
                }
                if (gorevDto.getDescription() != null) {
                    mevcutGorev.setDescription(gorevDto.getDescription());
                }
                if (gorevDto.getUserid() != null) {
                    mevcutGorev.setUserid(gorevDto.getUserid());
                }
                if (gorevDto.getPriority() != null) {
                    mevcutGorev.setPriority(gorevDto.getPriority());
                }
                if (gorevDto.getStatus() != null) {
                    mevcutGorev.setStatus(gorevDto.getStatus());
                }
                
                // Güncellenen görevi kaydet
                GorevYapisi guncellenenGorev = gorevRepository.save(mevcutGorev);
                
                return GorevDto.fromEntity(guncellenenGorev);
            }
            return null; // Görev bulunamadı
        } catch (Exception e) {
            return null; // Güncelleme işlemi başarısız
        }
    }
    
    /**
     * Tüm görevleri listeleme işlemi (Admin yetkisi)
     * @return Tüm görevlerin DTO listesi
     */
    public List<GorevDto> tumGorevleriGetir() {
        try {
            // Tüm görevleri getir
            List<GorevYapisi> gorevListesi = gorevRepository.findAll();
            
            // Entity'leri DTO'ya dönüştür
            return gorevListesi.stream()
                    .map(GorevDto::fromEntity)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of(); // Hata durumunda boş liste döndür
        }
    }
}
















