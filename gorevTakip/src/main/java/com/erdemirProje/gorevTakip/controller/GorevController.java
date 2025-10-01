package com.erdemirProje.gorevTakip.controller;

import com.erdemirProje.gorevTakip.dto.GorevDto;
import com.erdemirProje.gorevTakip.service.GorevService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.List;

@RestController
@RequestMapping("/api/gorev")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"}, 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
             allowCredentials = "true")
public class GorevController {
    
    private final GorevService gorevService;
    
    /**
     * Yeni görev ekleme endpoint'i
     * POST /api/gorev/ekle
     */
    @PostMapping("/ekle")
    public ResponseEntity<GorevDto> gorevEkle(@RequestBody GorevDto gorevDto) {
        try {
            GorevDto eklenenGorev = gorevService.gorevEkle(gorevDto);
            return new ResponseEntity<>(eklenenGorev, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Görev silme endpoint'i
     * DELETE /api/gorev/sil/{id}
     */
    @DeleteMapping("/sil/{id}")
    public ResponseEntity<String> gorevSil(@PathVariable Long id) {
        try {
            boolean silindi = gorevService.gorevSil(id);
            if (silindi) {
                return new ResponseEntity<>("Görev başarıyla silindi", HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Görev bulunamadı", HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>("Görev silinirken hata oluştu", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Görev güncelleme endpoint'i
     * PUT /api/gorev/guncelle/{id}
     */
    @PutMapping("/guncelle/{id}")
    public ResponseEntity<GorevDto> gorevGuncelle(@PathVariable Long id, @RequestBody GorevDto gorevDto) {
        try {
            GorevDto guncellenenGorev = gorevService.gorevGuncelle(id, gorevDto);
            if (guncellenenGorev != null) {
                return new ResponseEntity<>(guncellenenGorev, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Tüm görevleri listeleme endpoint'i (Admin yetkisi)
     * GET /api/gorev/tumunu-getir
     */
    @GetMapping("/tumunu-getir")
    public ResponseEntity<List<GorevDto>> tumGorevleriGetir() {
        try {
            List<GorevDto> gorevListesi = gorevService.tumGorevleriGetir();
            return new ResponseEntity<>(gorevListesi, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(List.of(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}