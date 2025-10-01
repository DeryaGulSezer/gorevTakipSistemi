package com.erdemirProje.gorevTakip.repository;

import com.erdemirProje.gorevTakip.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Username'e göre kullanıcı bulma
     * @param username Kullanıcı adı
     * @return Kullanıcı entity'si
     */
    Optional<User> findByUsername(String username);
    
    /**
     * Email'e göre kullanıcı bulma
     * @param email Email adresi
     * @return Kullanıcı entity'si
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Username'in kullanımda olup olmadığını kontrol etme
     * @param username Kontrol edilecek username
     * @return Username kullanımda mı?
     */
    boolean existsByUsername(String username);
    
    /**
     * Email'in kullanımda olup olmadığını kontrol etme
     * @param email Kontrol edilecek email
     * @return Email kullanımda mı?
     */
    boolean existsByEmail(String email);
    
    /**
     * Aktif kullanıcıları getirme
     * @return Aktif kullanıcı listesi
     */
    List<User> findByIsActiveTrue();
    
    /**
     * Role göre kullanıcıları getirme
     * @param role Kullanıcı rolü
     * @return Belirtilen rolde olan kullanıcılar
     */
    List<User> findByRole(User.Role role);
    
    /**
     * Direktör kullanıcıları getirme
     * @return Direktör kullanıcı listesi
     */
    @Query("SELECT u FROM User u WHERE u.role = 'DIRECTOR' AND u.isActive = true")
    List<User> findActiveDirectors();
    
    /**
     * Müdür kullanıcıları getirme
     * @return Müdür kullanıcı listesi
     */
    @Query("SELECT u FROM User u WHERE u.role = 'MANAGER' AND u.isActive = true")
    List<User> findActiveManagers();
    
    /**
     * Ekip üyesi kullanıcıları getirme
     * @return Ekip üyesi kullanıcı listesi
     */
    @Query("SELECT u FROM User u WHERE u.role = 'TEAM_MEMBER' AND u.isActive = true")
    List<User> findActiveTeamMembers();
    
    // HİYERARŞİK YAPILAR İÇİN
    
    /**
     * Belirli bir müdürün ekip üyelerini getir
     */
    @Query("SELECT u FROM User u WHERE u.manager.id = :managerId AND u.role = 'TEAM_MEMBER' AND u.isActive = true")
    List<User> findByManagerId(@Param("managerId") Long managerId);
    
    /**
     * Belirli bir müdürün ekip üyelerini getir
     */
    List<User> findByManager(User manager);
    
    /**
     * Müdürü olmayan ekip üyelerini getir (atanmamış)
     */
    @Query("SELECT u FROM User u WHERE u.role = 'TEAM_MEMBER' AND u.manager IS NULL AND u.isActive = true")
    List<User> findUnassignedTeamMembers();
    
    /**
     * Tüm müdürleri getir
     */
    @Query("SELECT u FROM User u WHERE u.role = 'MANAGER' AND u.isActive = true")
    List<User> findAllManagers();
    
    /**
     * Belirli bir müdürün yönettiği ekip üyesi sayısını getir
     */
    @Query("SELECT COUNT(u) FROM User u WHERE u.manager.id = :managerId AND u.role = 'TEAM_MEMBER'")
    Long countTeamMembersByManagerId(@Param("managerId") Long managerId);
    
    // Backward compatibility
    /**
     * Admin kullanıcıları getirme (backward compatibility)
     * @return Admin kullanıcı listesi
     */
    @Query("SELECT u FROM User u WHERE u.role = 'DIRECTOR' AND u.isActive = true")
    List<User> findActiveAdmins();
    
    /**
     * Normal kullanıcıları getirme (backward compatibility)
     * @return Normal kullanıcı listesi
     */
    @Query("SELECT u FROM User u WHERE u.role = 'TEAM_MEMBER' AND u.isActive = true")
    List<User> findActiveUsers();
    
    /**
     * Username veya email ile kullanıcı bulma (login için)
     * @param usernameOrEmail Username veya email
     * @return Kullanıcı entity'si
     */
    @Query("SELECT u FROM User u WHERE (u.username = :usernameOrEmail OR u.email = :usernameOrEmail) AND u.isActive = true")
    Optional<User> findByUsernameOrEmailAndIsActiveTrue(@Param("usernameOrEmail") String usernameOrEmail);
}