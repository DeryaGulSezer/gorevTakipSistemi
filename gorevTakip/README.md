# Görev Takip Sistemi - Backend

Spring Boot tabanlı RESTful API backend uygulaması.

## 🛠️ Teknolojiler

- **Java** 17
- **Spring Boot** 3.4.1
- **Spring Data JPA** - Veritabanı işlemleri
- **MS SQL Server** - Veritabanı
- **Lombok** - Boilerplate kod azaltma
- **Swagger/OpenAPI** - API dokümantasyonu
- **Maven** - Bağımlılık yönetimi

## 📁 Proje Yapısı

```
src/main/java/com/erdemirProje/gorevTakip/
├── config/
│   ├── CorsConfig.java              # CORS yapılandırması
│   └── DataInitializer.java         # Varsayılan veri oluşturma
├── controller/
│   ├── AuthController.java          # Kimlik doğrulama endpoint'leri
│   ├── DirectorController.java      # Direktör endpoint'leri
│   ├── ManagerController.java       # Müdür endpoint'leri
│   ├── UserGorevController.java     # Ekip üyesi endpoint'leri
│   ├── AdminController.java         # Admin endpoint'leri
│   └── GorevController.java         # Genel görev endpoint'leri
├── dto/
│   ├── GorevDto.java                # Görev DTO
│   ├── UserDto.java                 # Kullanıcı DTO
│   ├── LoginRequest.java            # Login isteği
│   ├── LoginResponse.java           # Login yanıtı
│   └── RegisterRequest.java         # Kayıt isteği
├── entity/
│   ├── GorevYapisi.java             # Görev entity
│   └── User.java                    # Kullanıcı entity
├── repository/
│   ├── GorevYapisiRepository.java   # Görev repository
│   └── UserRepository.java          # Kullanıcı repository
├── service/
│   ├── AuthService.java             # Kimlik doğrulama servisi
│   ├── DirectorService.java         # Direktör servisi
│   ├── ManagerService.java          # Müdür servisi
│   ├── UserGorevService.java        # Ekip üyesi servisi
│   └── GorevService.java            # Genel görev servisi
└── GorevTakipApplication.java       # Ana uygulama
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Java 17 veya üzeri
- Maven 3.6 veya üzeri
- MS SQL Server 2019 veya üzeri

### Veritabanı Kurulumu

1. **MS SQL Server'da veritabanı oluşturun:**
```sql
CREATE DATABASE gorev;
GO

USE gorev;
GO

-- Kullanıcı oluşturun (opsiyonel)
CREATE LOGIN gorev_user WITH PASSWORD = 'YOUR_PASSWORD';
CREATE USER gorev_user FOR LOGIN gorev_user;
ALTER ROLE db_owner ADD MEMBER gorev_user;
```

2. **application.properties dosyasını yapılandırın:**
```properties
# src/main/resources/application.properties.example dosyasını kopyalayın
# ve application.properties olarak kaydedin

spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=gorev;trustServerCertificate=true
spring.datasource.username=gorev_user
spring.datasource.password=YOUR_PASSWORD
```

### Uygulama Kurulumu

1. **Bağımlılıkları yükleyin:**
```bash
mvn clean install
```

2. **Uygulamayı çalıştırın:**
```bash
mvn spring-boot:run
```

3. **API erişimi:**
```
http://localhost:8080
```

## 📚 API Dokümantasyonu

Swagger UI: `http://localhost:8080/swagger-ui.html`

OpenAPI JSON: `http://localhost:8080/api-docs`

### Ana Endpoint'ler

#### Authentication (`/api/auth`)
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `GET /api/auth/current-user` - Mevcut kullanıcı bilgisi
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/validate-token` - Token doğrulama
- `GET /api/auth/all-users` - Tüm kullanıcıları getir

#### Director (`/api/director`)
- `GET /api/director/all-tasks` - Tüm görevleri getir
- `POST /api/director/assign-task` - Müdüre görev ata
- `PUT /api/director/update-task/{id}` - Görev güncelle
- `DELETE /api/director/delete-task/{id}` - Görev sil
- `GET /api/director/users` - Tüm kullanıcıları getir
- `GET /api/director/managers` - Tüm müdürleri getir
- `GET /api/director/report/tasks` - Görev raporu

#### Manager (`/api/manager`)
- `GET /api/manager/team-members` - Ekip üyelerini getir
- `GET /api/manager/team-tasks` - Ekip görevlerini getir
- `GET /api/manager/my-tasks` - Kendi görevlerini getir
- `POST /api/manager/assign-task` - Ekip üyesine görev ata
- `PUT /api/manager/update-task/{id}` - Görev güncelle
- `DELETE /api/manager/delete-task/{id}` - Görev sil
- `GET /api/manager/report/tasks` - Ekip raporu

#### User Tasks (`/api/user`)
- `GET /api/user/my-tasks` - Kendi görevlerimi getir
- `PUT /api/user/update-task-status/{id}` - Görev durumu güncelle
- `GET /api/user/my-stats` - Kendi istatistiklerimi getir

#### Task (`/api/task`)
- `GET /api/task/all` - Tüm görevleri getir
- `POST /api/task/add` - Yeni görev ekle
- `DELETE /api/task/delete/{id}` - Görev sil
- `PUT /api/task/update/{id}` - Görev güncelle

## 🗄️ Veritabanı Şeması

### User Tablosu
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY IDENTITY,
    username NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255),
    role NVARCHAR(50) NOT NULL,
    is_active BIT DEFAULT 1,
    manager_type NVARCHAR(255),
    manager_id BIGINT,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

### GorevYapisi Tablosu
```sql
CREATE TABLE gorev_yapisi (
    gorevid BIGINT PRIMARY KEY IDENTITY,
    isim NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    priority NVARCHAR(50),
    status NVARCHAR(50),
    userid BIGINT NOT NULL,
    assigned_by_id BIGINT,
    parent_task_id BIGINT,
    reported_to_director BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME,
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (assigned_by_id) REFERENCES users(id),
    FOREIGN KEY (parent_task_id) REFERENCES gorev_yapisi(gorevid)
);
```

## 👥 Varsayılan Kullanıcılar

Uygulama ilk çalıştırıldığında otomatik olarak oluşturulur:

| Rol | Kullanıcı Adı | Şifre | Email |
|-----|---------------|-------|-------|
| Direktör | director | director123 | director@gorevtakip.com |
| Müdür | manager | manager123 | manager@gorevtakip.com |
| Ekip Üyesi | teammember | team123 | teammember@gorevtakip.com |

## 🔒 Güvenlik

- JWT token tabanlı authentication (gelecek geliştirme)
- Role-Based Access Control (RBAC)
- SQL injection koruması (JPA)
- CORS yapılandırması
- Şifre güvenliği (düz metin - **production'da bcrypt kullanılmalı**)

## 📊 İş Mantığı

### Hiyerarşik Rol Sistemi

1. **Direktör (DIRECTOR)**
   - En üst seviye yetki
   - Tüm görevleri görüntüleyebilir
   - Müdürlere görev atayabilir
   - Tüm kullanıcıları yönetebilir

2. **Müdür (MANAGER)**
   - Ekip üyelerine görev atayabilir
   - Kendi ekibinin görevlerini yönetebilir
   - Kendi görevlerini görüntüleyebilir
   - Görev durumlarını güncelleyebilir

3. **Ekip Üyesi (TEAM_MEMBER)**
   - Sadece kendine atanan görevleri görür
   - Görev durumlarını güncelleyebilir
   - Kendi performans istatistiklerini görür

### Görev Durumları

- `PENDING` - Başlamadı
- `IN_PROGRESS` - Devam ediyor
- `COMPLETED` - Tamamlandı

### Öncelik Seviyeleri

- `yüksek` / `HIGH` - Yüksek öncelikli
- `orta` / `MEDIUM` - Orta öncelikli
- `düşük` / `LOW` - Düşük öncelikli

## 🧪 Test

Unit testleri çalıştırma:
```bash
mvn test
```

## 📦 Production Build

Production için build:
```bash
mvn clean package -DskipTests
```

JAR dosyası `target/` klasöründe oluşur:
```bash
java -jar target/gorevTakip-0.0.1-SNAPSHOT.jar
```

## 🔧 Yapılandırma

### application.properties

```properties
# Sunucu portu
server.port=8080

# Veritabanı
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=gorev
spring.datasource.username=gorev_user
spring.datasource.password=YOUR_PASSWORD

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Swagger
springdoc.swagger-ui.enabled=true
```

## 📝 Geliştirme Notları

- Lombok kullanılarak boilerplate kod azaltılmıştır
- Repository pattern kullanılmıştır
- Service layer ile business logic ayrılmıştır
- DTO pattern ile entity-model ayrımı yapılmıştır
- Custom JPQL query'leri kullanılmıştır

## ⚠️ Bilinen Limitasyonlar

- Şifreler düz metin olarak saklanıyor (production'da bcrypt kullanılmalı)
- JWT implementasyonu eksik (session tabanlı çalışıyor)
- File upload özelliği yok
- Email bildirimi yok
- Logging mekanizması basit (SLF4J eklenebilir)

## 🚀 Gelecek Geliştirmeler

- [ ] JWT token implementasyonu
- [ ] Bcrypt ile şifre hashleme
- [ ] Email bildirimleri
- [ ] Dosya yükleme
- [ ] WebSocket ile gerçek zamanlı bildirimler
- [ ] Detaylı loglama (SLF4J)
- [ ] Unit ve Integration testler
- [ ] Docker containerization

## 📄 Lisans

Bu proje kişisel kullanım içindir.

---

**Spring Boot Sürümü:** 3.4.1  
**Java Sürümü:** 17

