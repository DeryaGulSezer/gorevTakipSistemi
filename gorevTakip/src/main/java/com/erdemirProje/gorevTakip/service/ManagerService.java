package com.erdemirProje.gorevTakip.service;

import com.erdemirProje.gorevTakip.dto.GorevDto;
import com.erdemirProje.gorevTakip.dto.UserDto;
import com.erdemirProje.gorevTakip.entity.GorevYapisi;
import com.erdemirProje.gorevTakip.entity.User;
import com.erdemirProje.gorevTakip.gorevRepo.GorevYapisiRepository;
import com.erdemirProje.gorevTakip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerService {
    
    private final UserRepository userRepository;
    private final GorevYapisiRepository gorevRepository;
    
    /**
     * Müdürün kendi ekip üyelerini getir
     */
    public List<UserDto> getTeamMembers(Long managerId) {
        try {
            System.out.println("🔍 ManagerService.getTeamMembers çağrıldı - managerId: " + managerId);
            
            // Müdürün mevcut olduğunu kontrol et
            Optional<User> managerOpt = userRepository.findById(managerId);
            if (managerOpt.isEmpty()) {
                System.out.println("❌ Müdür bulunamadı: " + managerId);
                return List.of();
            }
            
            User manager = managerOpt.get();
            System.out.println("✅ Müdür bulundu: " + manager.getUsername() + " - " + manager.getRole());
            
            if (!manager.isManager()) {
                System.out.println("❌ Kullanıcı müdür değil: " + manager.getRole());
                return List.of();
            }
            
            // Bu müdüre bağlı ekip üyelerini getir
            List<User> teamMembers = userRepository.findByManagerId(managerId);
            System.out.println("🔍 Bulunan ekip üyesi sayısı: " + teamMembers.size());
            
            for (User member : teamMembers) {
                System.out.println("👤 Ekip üyesi: " + member.getUsername() + " - " + member.getRole() + " - Manager ID: " + (member.getManager() != null ? member.getManager().getId() : "null"));
            }
            
            // Debug: Ekip üyesi sayısı kontrolü
            System.out.println("🔍 Debug: Tüm ekip üyelerini kontrol et");
            List<User> allTeamMembers = userRepository.findByRole(User.Role.TEAM_MEMBER);
            System.out.println("   📊 Toplam ekip üyesi sayısı: " + allTeamMembers.size());
            for (User member : allTeamMembers) {
                System.out.println("   👤 ID: " + member.getId() + " | Username: " + member.getUsername() + " | Manager: " + (member.getManager() != null ? member.getManager().getUsername() + " (ID: " + member.getManager().getId() + ")" : "null"));
            }
            
            return teamMembers.stream()
                    .map(UserDto::fromEntity)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            System.out.println("❌ Ekip üyeleri getirilirken hata: " + e.getMessage());
            e.printStackTrace();
            return List.of();
        }
    }
    
    /**
     * Müdürün ekibindeki tüm görevleri getir
     */
    public List<GorevDto> getTeamTasks(Long managerId) {
        try {
            // Sadece bu müdürün atadığı ekip üyesi görevleri (direktör görmemeli)
            List<GorevYapisi> teamTasks = gorevRepository.findManagerAssignedTeamTasks(managerId);

            return teamTasks.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            System.out.println("❌ Ekip görevleri getirilirken hata: " + e.getMessage());
            return List.of();
        }
    }
    
    /**
     * Müdür ekip üyesine görev atar
     */
    public GorevDto assignTaskToTeamMember(GorevDto gorevDto) {
        try {
            System.out.println("🔍 ManagerService.assignTaskToTeamMember çağrıldı");
            System.out.println("📝 Görev Bilgileri: " + gorevDto.getIsim() + " -> User ID: " + gorevDto.getUserid());
            
            // Hedef kullanıcının müdürün ekibinde olduğunu kontrol et
            Optional<User> targetUserOpt = userRepository.findById(gorevDto.getUserid());
            if (targetUserOpt.isEmpty()) {
                System.out.println("❌ Hedef kullanıcı bulunamadı: " + gorevDto.getUserid());
                return null;
            }
            
            User targetUser = targetUserOpt.get();
            System.out.println("✅ Hedef kullanıcı bulundu: " + targetUser.getUsername() + " - " + targetUser.getRole());
            
            if (targetUser.getManager() == null) {
                System.out.println("❌ Kullanıcının müdürü yok: " + gorevDto.getUserid());
                return null;
            }
            
            System.out.println("✅ Kullanıcının müdürü: " + targetUser.getManager().getUsername());
            
            // Yeni görev oluştur (child görev)
            GorevYapisi newTask = new GorevYapisi();
            newTask.setIsim(gorevDto.getIsim());
            newTask.setDescription(gorevDto.getDescription());
            newTask.setUser(targetUser); // User entity'yi doğrudan ata
            newTask.setPriority(gorevDto.getPriority());
            newTask.setStatus(gorevDto.getStatus() != null ? gorevDto.getStatus() : "PENDING");
            
            // Kapsülleme: bu görevi atayan müdür, hedef kullanıcının mevcut müdürü
            newTask.setAssignedBy(targetUser.getManager());
            
            // Eğer DTO parentTaskId taşırsa bağla
            if (gorevDto.getParentTaskId() != null) {
                gorevRepository.findById(gorevDto.getParentTaskId()).ifPresent(newTask::setParentTask);
            }
            
            // Veritabanına kaydet
            GorevYapisi savedTask = gorevRepository.save(newTask);
            
            System.out.println("✅ Müdür görev atadı: " + savedTask.getIsim() + " -> " + targetUser.getUsername());
            return convertToDto(savedTask);
            
        } catch (Exception e) {
            System.out.println("❌ Görev atanırken hata: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Müdürün kendi görevlerini getir
     */
    public List<GorevDto> getManagerTasks(Long managerId) {
        try {
            // Müdürün kendi görevleri + kendi atadığı child görevler
            List<GorevYapisi> managerTasks = gorevRepository.findManagerVisibleTasks(managerId);
            return managerTasks.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.out.println("❌ Müdür görevleri getirilirken hata: " + e.getMessage());
            return List.of();
        }
    }
    
    /**
     * Müdürün ekip performans özeti
     */
    public Map<String, Object> getTeamPerformance(Long managerId) {
        try {
            List<GorevDto> teamTasks = getTeamTasks(managerId);
            List<UserDto> teamMembers = getTeamMembers(managerId);
            
            long completedTasks = teamTasks.stream()
                    .filter(task -> "COMPLETED".equals(task.getStatus()))
                    .count();
            
            long inProgressTasks = teamTasks.stream()
                    .filter(task -> "IN_PROGRESS".equals(task.getStatus()))
                    .count();
            
            long pendingTasks = teamTasks.stream()
                    .filter(task -> "PENDING".equals(task.getStatus()))
                    .count();
            
            return Map.of(
                "totalTeamMembers", teamMembers.size(),
                "totalTasks", teamTasks.size(),
                "completedTasks", completedTasks,
                "inProgressTasks", inProgressTasks,
                "pendingTasks", pendingTasks,
                "completionRate", teamTasks.isEmpty() ? 0 : (completedTasks * 100.0 / teamTasks.size())
            );
        } catch (Exception e) {
            System.out.println("❌ Ekip performansı hesaplanırken hata: " + e.getMessage());
            return Map.of();
        }
    }
    
    /**
     * Müdür ekibindeki görev günceller
     */
    public GorevDto updateTeamTask(Long taskId, GorevDto gorevDto) {
        try {
            System.out.println("🔄 Görev güncelleniyor - Task ID: " + taskId);
            
            Optional<GorevYapisi> taskOpt = gorevRepository.findById(taskId);
            if (taskOpt.isEmpty()) {
                System.out.println("❌ Görev bulunamadı: " + taskId);
                return null;
            }
            
            GorevYapisi existingTask = taskOpt.get();
            
            // Güncelle
            existingTask.setIsim(gorevDto.getIsim());
            existingTask.setDescription(gorevDto.getDescription());
            existingTask.setPriority(gorevDto.getPriority());
            // Düzenleme sonrası görev tekrar aktif olsun
            existingTask.setStatus("PENDING");
            
            // Yeni kullanıcı atanıyorsa güncelle
            if (gorevDto.getUserid() != null && !gorevDto.getUserid().equals(existingTask.getUser().getId())) {
                Optional<User> newUserOpt = userRepository.findById(gorevDto.getUserid());
                if (newUserOpt.isPresent()) {
                    existingTask.setUser(newUserOpt.get());
                    System.out.println("🔄 Görev yeni kullanıcıya atandı: " + newUserOpt.get().getUsername());
                }
            }
            
            GorevYapisi savedTask = gorevRepository.save(existingTask);
            System.out.println("✅ Görev başarıyla güncellendi");
            
            return convertToDto(savedTask);
            
        } catch (Exception e) {
            System.out.println("❌ Görev güncellenirken hata: " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Müdür ekibindeki görev siler
     */
    public boolean deleteTeamTask(Long taskId) {
        try {
            System.out.println("🗑️ Görev siliniyor - Task ID: " + taskId);
            
            Optional<GorevYapisi> taskOpt = gorevRepository.findById(taskId);
            if (taskOpt.isEmpty()) {
                System.out.println("❌ Görev bulunamadı: " + taskId);
                return false;
            }
            
            GorevYapisi task = taskOpt.get();
            
            // Görev durumunu kontrol et - sadece başlamamış görevler silinebilir
            if ("IN_PROGRESS".equals(task.getStatus()) || "COMPLETED".equals(task.getStatus())) {
                System.out.println("❌ Bu görev başlamış veya tamamlanmış, silinemez: " + taskId + " - Status: " + task.getStatus());
                return false;
            }
            
            // Görevi sil
            gorevRepository.deleteById(taskId);
            System.out.println("✅ Görev başarıyla silindi: " + task.getIsim());
            
            return true;
            
        } catch (Exception e) {
            System.out.println("❌ Görev silinirken hata: " + e.getMessage());
            return false;
        }
    }
    
    // archiveTeamTask kaldırıldı
    
    /**
     * Müdürün ekibinin tamamlanan görevlerini getir
     */
    public List<GorevDto> getCompletedTasks(Long managerId) {
        try {
            System.out.println("✅ Tamamlanan görevler getiriliyor - Manager ID: " + managerId);
            
            // Müdürün ekip üyelerini al
            List<User> teamMembers = userRepository.findByManagerId(managerId);
            
            if (teamMembers.isEmpty()) {
                System.out.println("ℹ️ Müdürün ekip üyesi yok");
                return List.of();
            }
            
            // Ekip üyelerinin ID'lerini topla
            List<Long> teamMemberIds = teamMembers.stream()
                    .map(User::getId)
                    .collect(Collectors.toList());
            
            System.out.println("👥 Ekip üye ID'leri: " + teamMemberIds);
            
            // Bu ekip üyelerinin COMPLETED görevlerini getir
            List<GorevYapisi> completedTasks = gorevRepository.findByUserIdInAndStatus(teamMemberIds, "COMPLETED");
            
            System.out.println("✅ Bulunan tamamlanmış görev sayısı: " + completedTasks.size());
            
            return completedTasks.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            System.out.println("❌ Tamamlanmış görevler getirilirken hata: " + e.getMessage());
            return List.of();
        }
    }
    
    // getArchivedTasks kaldırıldı
    
    // reportTasksToDirector kaldırıldı
    /**
     * Tamamlanan ekip üyesi görevlerini direktöre rapor et
     */
    public boolean reportTasksToDirector(Long managerId, List<Long> taskIds) {
        try {
            System.out.println("📊 (COMPLETED) Görevler direktöre rapor ediliyor - Manager ID: " + managerId);
            System.out.println("📝 Rapor edilecek görev ID'leri: " + taskIds);

            for (Long taskId : taskIds) {
                Optional<GorevYapisi> taskOpt = gorevRepository.findById(taskId);
                if (taskOpt.isEmpty()) {
                    System.out.println("❌ Görev bulunamadı: " + taskId);
                    continue;
                }

                GorevYapisi task = taskOpt.get();

                // Şartlar: görev tamamlanmış olmalı ve bu müdür tarafından atanmış bir ekip üyesi görevi olmalı
                boolean isCompleted = "COMPLETED".equals(task.getStatus());
                boolean assignedByManager = task.getAssignedBy() != null && task.getAssignedBy().getId().equals(managerId);
                boolean isTeamMemberTask = task.getUser() != null && task.getUser().getRole() == User.Role.TEAM_MEMBER;

                if (isCompleted && assignedByManager && isTeamMemberTask) {
                    task.setReportedToDirector(true);
                    gorevRepository.save(task);
                    System.out.println("✅ Görev direktöre rapor edildi: " + task.getIsim());
                } else {
                    System.out.println("⚠️ Rapor kriterlerini sağlamayan görev: " + task.getIsim());
                }
            }

            System.out.println("✅ Rapor işlemi tamamlandı");
            return true;
        } catch (Exception e) {
            System.out.println("❌ Rapor gönderilirken hata: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * GorevYapisi -> GorevDto dönüştürücü
     */
    private GorevDto convertToDto(GorevYapisi gorev) {
        GorevDto dto = new GorevDto();
        dto.setGorevid(gorev.getGorevid());
        dto.setIsim(gorev.getIsim());
        dto.setDescription(gorev.getDescription());
        dto.setUserid(gorev.getUser() != null ? gorev.getUser().getId() : null);
        dto.setPriority(gorev.getPriority());
        dto.setStatus(gorev.getStatus());
        dto.setReportedToDirector(gorev.getReportedToDirector());
        return dto;
    }
}