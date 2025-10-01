package com.erdemirProje.gorevTakip.gorevRepo;

import com.erdemirProje.gorevTakip.entity.GorevYapisi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GorevYapisiRepository extends JpaRepository<GorevYapisi, Long> {
    
    // Kullanıcı ID'sine göre görevleri getir
    List<GorevYapisi> findByUserId(Long userId);
    
    // Öncelik seviyesine göre görevleri getir
    List<GorevYapisi> findByPriority(String priority);
    
    // Kullanıcı ID ve öncelik seviyesine göre görevleri getir
    List<GorevYapisi> findByUserIdAndPriority(Long userId, String priority);
    
    // Açıklamada belirli bir kelime geçen görevleri getir
    List<GorevYapisi> findByDescriptionContaining(String keyword);
    
    // Custom query - Kullanıcının görev sayısını getir
    @Query("SELECT COUNT(g) FROM GorevYapisi g WHERE g.user.id = :userid")
    Long countGorevlerByUserid(@Param("userid") Long userid);
    
    // Custom query - Önceliğe göre sıralı görevleri getir
    @Query("SELECT g FROM GorevYapisi g ORDER BY " +
           "CASE g.priority " +
           "WHEN 'HIGH' THEN 1 " +
           "WHEN 'MEDIUM' THEN 2 " +
           "WHEN 'LOW' THEN 3 " +
           "ELSE 4 END")
    List<GorevYapisi> findAllOrderedByPriority();
    
    // KULLANICI PANELİ İÇİN YENİ QUERY'LER
    
    // Kullanıcının görevlerini öncelik sırasına göre getir
    @Query("SELECT g FROM GorevYapisi g WHERE g.user.id = :userid ORDER BY " +
           "CASE g.priority " +
           "WHEN 'yüksek' THEN 1 " +
           "WHEN 'HIGH' THEN 1 " +
           "WHEN 'orta' THEN 2 " +
           "WHEN 'MEDIUM' THEN 2 " +
           "WHEN 'düşük' THEN 3 " +
           "WHEN 'LOW' THEN 3 " +
           "ELSE 4 END")
    List<GorevYapisi> findByUseridOrderedByPriority(@Param("userid") Long userid);
    
    // Kullanıcının belirli status'teki görevlerini getir
    List<GorevYapisi> findByUserIdAndStatus(Long userId, String status);
    
    // Kullanıcının tamamlanmamış görevlerini öncelik sırasına göre getir
    @Query("SELECT g FROM GorevYapisi g WHERE g.user.id = :userid AND g.status != 'COMPLETED' ORDER BY " +
           "CASE g.priority " +
           "WHEN 'yüksek' THEN 1 " +
           "WHEN 'HIGH' THEN 1 " +
           "WHEN 'orta' THEN 2 " +
           "WHEN 'MEDIUM' THEN 2 " +
           "WHEN 'düşük' THEN 3 " +
           "WHEN 'LOW' THEN 3 " +
           "ELSE 4 END")
    List<GorevYapisi> findActiveTasksByUseridOrderedByPriority(@Param("userid") Long userid);
    
    // Kullanıcının tamamlanmış görev sayısını getir
    @Query("SELECT COUNT(g) FROM GorevYapisi g WHERE g.user.id = :userid AND g.status = 'COMPLETED'")
    Long countCompletedTasksByUserid(@Param("userid") Long userid);
    
    // Kullanıcının aktif görev sayısını getir
    @Query("SELECT COUNT(g) FROM GorevYapisi g WHERE g.user.id = :userid AND g.status != 'COMPLETED'")
    Long countActiveTasksByUserid(@Param("userid") Long userid);
    
    // MÜDÜR PANELİ İÇİN YENİ QUERY'LER
    
    // Birden çok kullanıcının görevlerini getir (Müdür ekibinin görevleri için)
    @Query("SELECT g FROM GorevYapisi g WHERE g.user.id IN :userIds ORDER BY g.gorevid DESC")
    List<GorevYapisi> findByUserIdIn(@Param("userIds") List<Long> userIds);
    
    // Birden çok kullanıcının belirli durumdaki görevlerini getir (Arşiv için)
    @Query("SELECT g FROM GorevYapisi g WHERE g.user.id IN :userIds AND g.status = :status ORDER BY g.gorevid DESC")
    List<GorevYapisi> findByUserIdInAndStatus(@Param("userIds") List<Long> userIds, @Param("status") String status);
    
    // Direktöre rapor edilen görevleri getir
    @Query("SELECT g FROM GorevYapisi g WHERE g.reportedToDirector = true ORDER BY g.gorevid DESC")
    List<GorevYapisi> findReportedToDirector();

    // Direktör görünümü: sadece müdürlere atanmış ve child olmayan VE bu direktör tarafından atanmış görevler
    @Query("SELECT g FROM GorevYapisi g WHERE g.user.role = 'MANAGER' AND g.parentTask IS NULL ORDER BY g.gorevid DESC")
    List<GorevYapisi> findDirectorVisibleTasks(@Param("directorId") Long directorId);

    // Müdür görünümü: kendi görevleri + ekibe verdiği (child) görevler
    @Query("SELECT g FROM GorevYapisi g WHERE (g.user.id = :managerId) OR (g.parentTask IS NOT NULL AND g.assignedBy.id = :managerId) ORDER BY g.gorevid DESC")
    List<GorevYapisi> findManagerVisibleTasks(@Param("managerId") Long managerId);

    // Müdürün sadece kendi görevleri (ekibe verdiği görevler hariç)
    @Query("SELECT g FROM GorevYapisi g WHERE g.user.id = :managerId ORDER BY g.gorevid DESC")
    List<GorevYapisi> findManagerOwnTasks(@Param("managerId") Long managerId);

    // Müdürün ekibe kendisinin atadığı görevler (sadece TEAM_MEMBER kullanıcılarına, child olsun/olmasın)
    @Query("SELECT g FROM GorevYapisi g WHERE g.assignedBy.id = :managerId AND g.user.role = 'TEAM_MEMBER' ORDER BY g.gorevid DESC")
    List<GorevYapisi> findManagerAssignedTeamTasks(@Param("managerId") Long managerId);
}