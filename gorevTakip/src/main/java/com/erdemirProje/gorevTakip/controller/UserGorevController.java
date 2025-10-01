package com.erdemirProje.gorevTakip.controller;

import com.erdemirProje.gorevTakip.dto.GorevDto;
import com.erdemirProje.gorevTakip.service.UserGorevService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/gorev")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200") // Angular frontend URL'i
public class UserGorevController {
    
    private final UserGorevService userGorevService;
    
    /**
     * Kullanıcının tüm görevlerini öncelik sırasına göre getir
     * GET /api/user/gorev/{userid}
     */
    @GetMapping("/{userid}")
    public ResponseEntity<List<GorevDto>> getUserTasks(@PathVariable Long userid) {
        try {
            List<GorevDto> gorevler = userGorevService.getUserTasksOrderedByPriority(userid);
            return ResponseEntity.ok(gorevler);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Kullanıcının aktif (tamamlanmamış) görevlerini getir
     * GET /api/user/gorev/{userid}/active
     */
    @GetMapping("/{userid}/active")
    public ResponseEntity<List<GorevDto>> getUserActiveTasks(@PathVariable Long userid) {
        try {
            List<GorevDto> gorevler = userGorevService.getUserActiveTasksOrderedByPriority(userid);
            return ResponseEntity.ok(gorevler);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Kullanıcının belirli status'teki görevlerini getir
     * GET /api/user/gorev/{userid}/status/{status}
     */
    @GetMapping("/{userid}/status/{status}")
    public ResponseEntity<List<GorevDto>> getUserTasksByStatus(
            @PathVariable Long userid, 
            @PathVariable String status) {
        try {
            List<GorevDto> gorevler = userGorevService.getUserTasksByStatus(userid, status);
            return ResponseEntity.ok(gorevler);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Görevi tamamlandı olarak işaretle
     * PUT /api/user/gorev/{gorevId}/complete/{userid}
     */
    @PutMapping("/{gorevId}/complete/{userid}")
    public ResponseEntity<String> markTaskAsCompleted(
            @PathVariable Long gorevId, 
            @PathVariable Long userid) {
        try {
            boolean success = userGorevService.markTaskAsCompleted(gorevId, userid);
            
            if (success) {
                return ResponseEntity.ok("Görev başarıyla tamamlandı!");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Görev bulunamadı veya yetkiniz yok!");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Görev tamamlanırken bir hata oluştu!");
        }
    }
    
    /**
     * Görev durumunu güncelle
     * PUT /api/user/gorev/{gorevId}/status/{userid}
     */
    @PutMapping("/{gorevId}/status/{userid}")
    public ResponseEntity<String> updateTaskStatus(
            @PathVariable Long gorevId,
            @PathVariable Long userid,
            @RequestBody StatusUpdateRequest request) {
        try {
            boolean success = userGorevService.updateTaskStatus(gorevId, userid, request.getStatus());
            
            if (success) {
                return ResponseEntity.ok("Görev durumu başarıyla güncellendi!");
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Görev durumu güncellenemedi!");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Görev durumu güncellenirken bir hata oluştu!");
        }
    }
    
    /**
     * Kullanıcının görev istatistiklerini getir
     * GET /api/user/gorev/{userid}/stats
     */
    @GetMapping("/{userid}/stats")
    public ResponseEntity<UserGorevService.UserTaskStats> getUserTaskStats(@PathVariable Long userid) {
        try {
            UserGorevService.UserTaskStats stats = userGorevService.getUserTaskStats(userid);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Status güncelleme için request body sınıfı
     */
    public static class StatusUpdateRequest {
        private String status;
        
        public StatusUpdateRequest() {}
        
        public StatusUpdateRequest(String status) {
            this.status = status;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
    }
}