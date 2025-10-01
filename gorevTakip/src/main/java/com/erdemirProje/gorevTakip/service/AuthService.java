package com.erdemirProje.gorevTakip.service;

import com.erdemirProje.gorevTakip.dto.*;
import com.erdemirProje.gorevTakip.entity.User;
import com.erdemirProje.gorevTakip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    
    // Basit session store (gerçek uygulamada Redis veya database kullanılır)
    private final Map<String, User> activeSessions = new ConcurrentHashMap<>();
    
    /**
     * Kullanıcı girişi
     * @param loginRequest Giriş bilgileri
     * @return Giriş sonucu
     */
    public LoginResponse login(LoginRequest loginRequest) {
        try {
            // Kullanıcıyı username veya email ile bul
            Optional<User> userOptional = userRepository
                .findByUsernameOrEmailAndIsActiveTrue(loginRequest.getUsernameOrEmail());
            
            if (userOptional.isEmpty()) {
                return new LoginResponse("Kullanıcı bulunamadı veya hesap aktif değil!");
            }
            
            User user = userOptional.get();
            
            // Şifre kontrolü (gerçek uygulamada bcrypt kullanılır)
            if (!loginRequest.getPassword().equals(user.getPassword())) {
                return new LoginResponse("Kullanıcı adı veya şifre hatalı!");
            }
            
            // Session token oluştur
            String token = generateToken();
            activeSessions.put(token, user);
            
            // Başarılı giriş yanıtı
            LoginResponse response = new LoginResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                token
            );
            
            System.out.println("✅ Login başarılı - User: " + user.getUsername() + ", Role: " + user.getRole());
            return response;
            
        } catch (Exception e) {
            return new LoginResponse("Giriş işlemi sırasında bir hata oluştu!");
        }
    }
    
    /**
     * Kullanıcı kaydı
     * @param registerRequest Kayıt bilgileri
     * @return Kayıt sonucu
     */
    public LoginResponse register(RegisterRequest registerRequest) {
        try {
            // Username kontrolü
            if (userRepository.existsByUsername(registerRequest.getUsername())) {
                return new LoginResponse("Bu kullanıcı adı zaten kullanımda!");
            }
            
            // Email kontrolü
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return new LoginResponse("Bu email adresi zaten kullanımda!");
            }
            
            // Yeni kullanıcı oluştur
            User newUser = new User();
            // ID otomatik olarak generate edilecek, manuel set etmiyoruz
            newUser.setUsername(registerRequest.getUsername());
            newUser.setPassword(registerRequest.getPassword()); // Gerçek uygulamada bcrypt ile hash'le
            newUser.setEmail(registerRequest.getEmail());
            newUser.setFullName(registerRequest.getFullName());
            newUser.setRole(registerRequest.getRole());
            newUser.setManagerType(registerRequest.getManagerType()); // Müdür tipi
            newUser.setIsActive(true);
            
            // Veritabanına kaydet
            User savedUser = userRepository.save(newUser);
            
            // Otomatik giriş yap
            String token = generateToken();
            activeSessions.put(token, savedUser);
            
            return new LoginResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                savedUser.getRole(),
                token
            );
            
        } catch (Exception e) {
            return new LoginResponse("Kayıt işlemi sırasında bir hata oluştu!");
        }
    }
    
    /**
     * Çıkış işlemi
     * @param token Session token
     * @return Çıkış başarılı mı?
     */
    public boolean logout(String token) {
        return activeSessions.remove(token) != null;
    }
    
    /**
     * Token'a göre kullanıcı bilgisi al
     * @param token Session token
     * @return Kullanıcı bilgisi
     */
    public Optional<User> getUserByToken(String token) {
        return Optional.ofNullable(activeSessions.get(token));
    }
    
    /**
     * Token'ın geçerli olup olmadığını kontrol et
     * @param token Session token
     * @return Token geçerli mi?
     */
    public boolean isTokenValid(String token) {
        return token != null && activeSessions.containsKey(token);
    }
    
    /**
     * Kullanıcının admin olup olmadığını kontrol et
     * @param token Session token
     * @return Admin mi?
     */
    public boolean isAdmin(String token) {
        return getUserByToken(token)
            .map(User::isAdmin)
            .orElse(false);
    }
    
    /**
     * Basit token oluştur
     * @return Rastgele token
     */
    private String generateToken() {
        return UUID.randomUUID().toString() + "-" + System.currentTimeMillis();
    }
    
    /**
     * Tüm aktif kullanıcıları getir (admin yetkisi gerekli)
     * @return Aktif kullanıcı listesi
     */
    public List<UserDto> getAllActiveUsers() {
        return userRepository.findByIsActiveTrue()
            .stream()
            .map(UserDto::fromEntity)
            .toList();
    }
    
    /**
     * İlk admin kullanıcısını oluştur (sistem başlangıcında)
     */
    public void createDefaultDirector() {
        if (userRepository.findByRole(User.Role.DIRECTOR).isEmpty()) {
            User director = new User();
            director.setUsername("director");
            director.setPassword("director123"); // Gerçek uygulamada hash'le
            director.setEmail("director@gorevtakip.com");
            director.setFullName("Sistem Direktörü");
            director.setRole(User.Role.DIRECTOR);
            director.setIsActive(true);
            director.setManager(null); // Direktörün müdürü yok
            
            userRepository.save(director);
            System.out.println("✅ Default direktör kullanıcısı oluşturuldu: director/director123");
        }
    }
    
    public void createDefaultManager() {
        // İlk direktörü bul
        Optional<User> directorOpt = userRepository.findByRole(User.Role.DIRECTOR).stream().findFirst();
        if (directorOpt.isEmpty()) {
            System.out.println("⚠️ Direktör bulunamadı, müdür oluşturulamadı");
            return;
        }
        
        if (userRepository.findByRole(User.Role.MANAGER).isEmpty()) {
            User manager = new User();
            manager.setUsername("manager");
            manager.setPassword("manager123");
            manager.setEmail("manager@gorevtakip.com");
            manager.setFullName("Demo Müdürü");
            manager.setRole(User.Role.MANAGER);
            manager.setIsActive(true);
            manager.setManager(null); // Müdürün de müdürü yok (direktöre rapor verir)
            
            userRepository.save(manager);
            System.out.println("✅ Default müdür kullanıcısı oluşturuldu: manager/manager123");
        }
    }
    
    /**
     * Demo normal kullanıcısını oluştur (sistem başlangıcında)
     */
    public void createDefaultTeamMember() {
        // İlk müdürü bul
        List<User> allManagers = userRepository.findByRole(User.Role.MANAGER);
        System.out.println("🔍 Müdür arama: Bulunan müdür sayısı: " + allManagers.size());
        for (User manager : allManagers) {
            System.out.println("👤 Müdür: " + manager.getUsername() + " - ID: " + manager.getId());
        }
        
        Optional<User> managerOpt = allManagers.stream().findFirst();
        
        if (userRepository.findByUsername("teammember").isEmpty()) {
            User teamMember = new User();
            teamMember.setUsername("teammember");
            teamMember.setPassword("team123");
            teamMember.setEmail("teammember@gorevtakip.com");
            teamMember.setFullName("Demo Ekip Üyesi");
            teamMember.setRole(User.Role.TEAM_MEMBER);
            teamMember.setIsActive(true);
            
            // Eğer müdür varsa, ona ata
            if (managerOpt.isPresent()) {
                User manager = managerOpt.get();
                teamMember.setManager(manager);
                System.out.println("✅ Ekip üyesi müdüre atandı: " + manager.getUsername() + " (ID: " + manager.getId() + ")");
            } else {
                teamMember.setManager(null); // Henüz atanmamış
                System.out.println("⚠️ Müdür bulunamadı, ekip üyesi atanmamış olarak oluşturuldu");
            }
            
            User savedTeamMember = userRepository.save(teamMember);
            System.out.println("✅ Default ekip üyesi oluşturuldu: teammember/team123 (ID: " + savedTeamMember.getId() + ")");
            System.out.println("📝 Kaydedilen ekip üyesinin müdür ID'si: " + (savedTeamMember.getManager() != null ? savedTeamMember.getManager().getId() : "NULL"));
        }
    }

    /**
     * Admin paneli için kullanıcı oluşturma (UserDto döner, session oluşturmaz)
     */
    public UserDto registerForAdmin(RegisterRequest registerRequest) {
        try {
            // Username kontrolü
            if (userRepository.existsByUsername(registerRequest.getUsername())) {
                return null; // Kullanıcı adı zaten mevcut
            }
            
            // Email kontrolü  
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return null; // Email zaten mevcut
            }
            
            // Yeni kullanıcı oluştur
            User newUser = new User();
            newUser.setUsername(registerRequest.getUsername());
            newUser.setPassword(registerRequest.getPassword()); // Gerçek uygulamada bcrypt ile hash'le
            newUser.setEmail(registerRequest.getEmail());
            newUser.setFullName(registerRequest.getFullName());
            newUser.setRole(registerRequest.getRole());
            newUser.setIsActive(true);
            // Eğer ekip üyesi oluşturuluyorsa ve managerId gönderilmişse, müdüre ata
            if (registerRequest.getRole() == User.Role.TEAM_MEMBER && registerRequest.getManagerId() != null) {
                userRepository.findById(registerRequest.getManagerId()).ifPresent(manager -> {
                    if (manager.getRole() == User.Role.MANAGER) {
                        newUser.setManager(manager);
                    }
                });
            }
            
            // Veritabanına kaydet
            User savedUser = userRepository.save(newUser);
            
            return UserDto.fromEntity(savedUser);
        } catch (Exception e) {
            System.out.println("❌ Kullanıcı oluşturulurken hata: " + e.getMessage());
            return null;
        }
    }

    /**
     * Tüm kullanıcıları getir (Admin Only)
     */
    public List<UserDto> getAllUsers() {
        try {
            return userRepository.findAll()
                    .stream()
                    .map(UserDto::fromEntity)
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            System.out.println("❌ Kullanıcılar getirilirken hata: " + e.getMessage());
            return List.of();
        }
    }

    /**
     * ID'ye göre kullanıcı getir (Admin Only)
     */
    public Optional<User> findById(Long id) {
        try {
            return userRepository.findById(id);
        } catch (Exception e) {
            System.out.println("❌ Kullanıcı getirilirken hata: " + e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Kullanıcıyı sil (Admin Only)
     */
    public boolean deleteUser(Long userId) {
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                
                // Direktör kullanıcısını silmeyi engelle
                if (user.getRole() == User.Role.DIRECTOR) {
                    System.out.println("⚠️ Direktör kullanıcısı silinemez!");
                    return false;
                }
                
                userRepository.delete(user);
                System.out.println("✅ Kullanıcı silindi: " + user.getUsername());
                return true;
            }
            return false;
        } catch (Exception e) {
            System.out.println("❌ Kullanıcı silinirken hata: " + e.getMessage());
            return false;
        }
    }

    /**
     * Kullanıcı bilgilerini güncelle (Admin Only)
     */
    public UserDto updateUser(Long userId, com.erdemirProje.gorevTakip.controller.AdminController.UserUpdateRequest request) {
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                
                // Güncelleme işlemleri
                if (request.getUsername() != null && !request.getUsername().isEmpty()) {
                    // Kullanıcı adı değişikliği kontrolü
                    if (!user.getUsername().equals(request.getUsername())) {
                        Optional<User> existingUser = userRepository.findByUsername(request.getUsername());
                        if (existingUser.isPresent()) {
                            return null; // Kullanıcı adı zaten mevcut
                        }
                    }
                    user.setUsername(request.getUsername());
                }
                
                if (request.getEmail() != null && !request.getEmail().isEmpty()) {
                    user.setEmail(request.getEmail());
                }
                
                if (request.getFullName() != null && !request.getFullName().isEmpty()) {
                    user.setFullName(request.getFullName());
                }
                
                if (request.getRole() != null && !request.getRole().isEmpty()) {
                    try {
                        User.Role newRole = User.Role.valueOf(request.getRole().toUpperCase());
                        user.setRole(newRole);
                    } catch (IllegalArgumentException e) {
                        System.out.println("⚠️ Geçersiz rol: " + request.getRole());
                    }
                }
                
                if (request.getManagerType() != null) {
                    user.setManagerType(request.getManagerType());
                }
                
                if (request.getIsActive() != null) {
                    user.setIsActive(request.getIsActive());
                }

                // Ekip üyesi için müdür ataması/güncellemesi
                if (request.getManagerId() != null && user.getRole() == User.Role.TEAM_MEMBER) {
                    userRepository.findById(request.getManagerId()).ifPresent(manager -> {
                        if (manager.getRole() == User.Role.MANAGER) {
                            user.setManager(manager);
                        }
                    });
                }
                
                User updatedUser = userRepository.save(user);
                return UserDto.fromEntity(updatedUser);
            }
            return null;
        } catch (Exception e) {
            System.out.println("❌ Kullanıcı güncellenirken hata: " + e.getMessage());
            return null;
        }
    }

    /**
     * Tüm müdürleri getir (Admin için)
     */
    public List<UserDto> getAllManagersForAdmin() {
        try {
            return userRepository.findActiveManagers()
                    .stream()
                    .map(UserDto::fromEntity)
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            System.out.println("❌ Müdürler getirilirken hata: " + e.getMessage());
            return List.of();
        }
    }
}