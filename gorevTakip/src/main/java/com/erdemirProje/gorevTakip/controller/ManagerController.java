package com.erdemirProje.gorevTakip.controller;

import com.erdemirProje.gorevTakip.dto.GorevDto;
import com.erdemirProje.gorevTakip.dto.UserDto;
import com.erdemirProje.gorevTakip.service.ManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class ManagerController {
    
    private final ManagerService managerService;
    
    /**
     * Müdürün kendi ekip üyelerini getir
     */
    @GetMapping("/team-members/{managerId}")
    public ResponseEntity<List<UserDto>> getTeamMembers(@PathVariable Long managerId) {
        try {
            List<UserDto> teamMembers = managerService.getTeamMembers(managerId);
            return ResponseEntity.ok(teamMembers);
        } catch (Exception e) {
            System.out.println("❌ Ekip üyeleri getirilirken hata: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Müdürün kendi ekibindeki görevleri getir
     */
    @GetMapping("/team-tasks/{managerId}")
    public ResponseEntity<List<GorevDto>> getTeamTasks(@PathVariable Long managerId) {
        try {
            List<GorevDto> tasks = managerService.getTeamTasks(managerId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            System.out.println("❌ Ekip görevleri getirilirken hata: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Müdür ekip üyesine görev atar
     */
    @PostMapping("/assign-task")
    public ResponseEntity<Map<String, Object>> assignTask(@RequestBody GorevDto gorevDto) {
        try {
            GorevDto createdTask = managerService.assignTaskToTeamMember(gorevDto);
            if (createdTask != null) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Görev başarıyla atandı",
                    "task", createdTask
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Görev atanamadı"
                ));
            }
        } catch (Exception e) {
            System.out.println("❌ Görev atanırken hata: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Görev atanırken hata oluştu: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Müdürün kendi görevlerini getir
     */
    @GetMapping("/my-tasks/{managerId}")
    public ResponseEntity<List<GorevDto>> getManagerTasks(@PathVariable Long managerId) {
        try {
            List<GorevDto> tasks = managerService.getManagerTasks(managerId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            System.out.println("❌ Müdür görevleri getirilirken hata: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Müdürün ekip üyesi performans özeti
     */
    @GetMapping("/team-performance/{managerId}")
    public ResponseEntity<Map<String, Object>> getTeamPerformance(@PathVariable Long managerId) {
        try {
            Map<String, Object> performance = managerService.getTeamPerformance(managerId);
            return ResponseEntity.ok(performance);
        } catch (Exception e) {
            System.out.println("❌ Ekip performansı getirilirken hata: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Müdür görev günceller
     */
    @PutMapping("/update-task/{taskId}")
    public ResponseEntity<Map<String, Object>> updateTask(@PathVariable Long taskId, @RequestBody GorevDto gorevDto) {
        try {
            GorevDto updatedTask = managerService.updateTeamTask(taskId, gorevDto);
            if (updatedTask != null) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Görev başarıyla güncellendi",
                    "task", updatedTask
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Görev güncellenemedi"
                ));
            }
        } catch (Exception e) {
            System.out.println("❌ Görev güncellenirken hata: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Görev güncellenirken hata oluştu: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Müdür görev siler
     */
    @DeleteMapping("/delete-task/{taskId}")
    public ResponseEntity<Map<String, Object>> deleteTask(@PathVariable Long taskId) {
        try {
            System.out.println("🗑️ Controller: Görev silme isteği - Task ID: " + taskId);
            
            if (taskId == null) {
                System.out.println("❌ Controller: Task ID null!");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Görev ID boş olamaz"
                ));
            }
            
            boolean deleted = managerService.deleteTeamTask(taskId);
            if (deleted) {
                System.out.println("✅ Controller: Görev başarıyla silindi");
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Görev başarıyla silindi"
                ));
            } else {
                System.out.println("❌ Controller: Görev silinemedi");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Görev silinemedi - ID: " + taskId + " bulunamadı veya silinemedi"
                ));
            }
        } catch (Exception e) {
            System.out.println("❌ Controller: Görev silinirken hata: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Görev silinirken hata oluştu: " + e.getMessage()
            ));
        }
    }
    
    // archive-task endpoint kaldırıldı
    
    /**
     * Müdürün tamamlanan görevlerini getir
     */
    @GetMapping("/completed-tasks/{managerId}")
    public ResponseEntity<List<GorevDto>> getCompletedTasks(@PathVariable Long managerId) {
        try {
            List<GorevDto> completedTasks = managerService.getCompletedTasks(managerId);
            return ResponseEntity.ok(completedTasks);
        } catch (Exception e) {
            System.out.println("❌ Tamamlanan görevler getirilirken hata: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    // archived-tasks endpoint kaldırıldı
    
    /**
     * Tamamlanan görevleri direktöre rapor et
     */
    @PostMapping("/report-to-director/{managerId}")
    public ResponseEntity<Map<String, Object>> reportTasksToDirector(
            @PathVariable Long managerId,
            @RequestBody Map<String, List<Long>> request) {
        try {
            List<Long> taskIds = request.get("taskIds");
            if (taskIds == null || taskIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Rapor edilecek görev seçilmedi"
                ));
            }

            boolean success = managerService.reportTasksToDirector(managerId, taskIds);
            if (success) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Görevler başarıyla direktöre rapor edildi",
                        "reportedCount", taskIds.size()
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Rapor gönderilirken hata oluştu"
                ));
            }
        } catch (Exception e) {
            System.out.println("❌ Rapor gönderilirken hata: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Rapor gönderilirken hata oluştu: " + e.getMessage()
            ));
        }
    }
}
