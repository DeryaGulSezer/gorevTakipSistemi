# Görev Takip Sistemi

Hiyerarşik rol tabanlı görev yönetim ve takip sistemi.

## 📋 Proje Hakkında

Bu proje, Direktör, Müdür ve Ekip Üyesi rollerinden oluşan hiyerarşik bir görev takip sistemidir. Her rol, kendi yetki seviyesinde görev oluşturabilir, atayabilir ve takip edebilir.

## 🎯 Özellikler

### Roller ve Yetkiler

#### 👔 Direktör (Director)
- Tüm görevleri görüntüleme
- Müdürlere görev atama
- Kullanıcı yönetimi (ekle, düzenle, sil)
- Sistem genelinde raporlama

#### 👨‍💼 Müdür (Manager)
- Ekip üyelerine görev atama
- Kendi ekibinin görevlerini görüntüleme ve yönetme
- Ekip üyelerinin performansını takip etme
- Görev durumlarını güncelleme

#### 👤 Ekip Üyesi (Team Member)
- Kendisine atanan görevleri görüntüleme
- Görev durumlarını güncelleme (Başlamadı, Devam Ediyor, Tamamlandı)
- Kendi performans istatistiklerini görüntüleme

### Görev Özellikleri
- 📝 Görev oluşturma ve atama
- 🎯 Öncelik seviyeleri (Yüksek, Orta, Düşük)
- 📊 Görev durumu takibi
- 📅 Otomatik tarih ve zaman kaydı
- 🔄 Gerçek zamanlı güncellemeler
- 📈 İstatistikler ve raporlama

## 🛠️ Teknolojiler

### Backend
- **Java 17**
- **Spring Boot 3.4.1**
- **Spring Data JPA**
- **MS SQL Server**
- **Lombok**
- **Swagger/OpenAPI**

### Frontend
- **Angular 20.1.0**
- **TypeScript 5.8.2**
- **RxJS**
- **Angular Router**
- **SCSS**

## 📦 Kurulum

### Gereksinimler
- Java 17 veya üzeri
- Node.js 18 veya üzeri
- MS SQL Server
- Maven
- Angular CLI

### Backend Kurulumu

1. MS SQL Server veritabanı oluşturun:
```sql
CREATE DATABASE GorevTakipDB;
```

2. `gorevTakip/src/main/resources/application.properties` dosyasını düzenleyin:
```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=GorevTakipDB;encrypt=true;trustServerCertificate=true
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD
```

3. Backend'i çalıştırın:
```bash
cd gorevTakip
mvn clean install
mvn spring-boot:run
```

Backend `http://localhost:8080` adresinde çalışacaktır.

### Frontend Kurulumu

1. Bağımlılıkları yükleyin:
```bash
cd front-end
npm install
```

2. Frontend'i çalıştırın:
```bash
ng serve
```

Frontend `http://localhost:4200` adresinde çalışacaktır.

## 👥 Varsayılan Kullanıcılar

Sistem ilk çalıştırıldığında aşağıdaki varsayılan kullanıcılar oluşturulur:

| Rol | Kullanıcı Adı | Şifre |
|-----|---------------|-------|
| Direktör | director | director123 |
| Müdür | manager | manager123 |
| Ekip Üyesi | teammember | team123 |

## 📚 API Dokümantasyonu

Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### Ana Endpoint'ler

#### Auth Controller
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `GET /api/auth/current-user` - Mevcut kullanıcı bilgisi
- `POST /api/auth/logout` - Çıkış

#### Director Controller
- `GET /api/director/all-tasks` - Tüm görevleri getir
- `POST /api/director/assign-task` - Müdüre görev ata
- `DELETE /api/director/delete-task/{id}` - Görev sil
- `GET /api/director/users` - Tüm kullanıcıları getir

#### Manager Controller
- `GET /api/manager/team-members` - Ekip üyelerini getir
- `GET /api/manager/team-tasks` - Ekip görevlerini getir
- `POST /api/manager/assign-task` - Ekip üyesine görev ata
- `PUT /api/manager/update-task/{id}` - Görev güncelle
- `DELETE /api/manager/delete-task/{id}` - Görev sil

#### User Tasks Controller
- `GET /api/user/my-tasks` - Kendi görevlerimi getir
- `PUT /api/user/update-task-status/{id}` - Görev durumu güncelle
- `GET /api/user/my-stats` - Kendi istatistiklerimi getir

## 🗂️ Proje Yapısı

```
NEW/
├── front-end/                 # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── director-panel/      # Direktör paneli
│   │   │   ├── manager-panel/       # Müdür paneli
│   │   │   ├── user-tasks/          # Ekip üyesi görevleri
│   │   │   ├── login/               # Giriş sayfası
│   │   │   ├── services/            # Angular servisleri
│   │   │   └── guards/              # Route guard'ları
│   │   └── ...
│   └── ...
│
└── gorevTakip/               # Spring Boot Backend
    ├── src/
    │   ├── main/
    │   │   ├── java/com/erdemirProje/gorevTakip/
    │   │   │   ├── controller/      # REST Controller'lar
    │   │   │   ├── service/         # Business Logic
    │   │   │   ├── entity/          # JPA Entity'ler
    │   │   │   ├── repository/      # JPA Repository'ler
    │   │   │   ├── dto/             # Data Transfer Objects
    │   │   │   └── config/          # Konfigürasyon
    │   │   └── resources/
    │   │       └── application.properties
    │   └── ...
    └── ...
```

## 🔒 Güvenlik

- JWT token tabanlı authentication
- Role-Based Access Control (RBAC)
- CORS yapılandırması
- SQL injection koruması (JPA)

## 🚀 Gelecek Geliştirmeler

- [ ] Email bildirimleri
- [ ] Dosya ekleme
- [ ] Yorum sistemi
- [ ] Gelişmiş raporlama
- [ ] WebSocket ile gerçek zamanlı bildirimler
- [ ] Dashboard ve grafikler
- [ ] Takvim görünümü
- [ ] Görev şablonları

## 📝 Lisans

Bu proje kişisel kullanım içindir.

## 👨‍💻 Geliştirici

Derya Gül Sezer

---

**Not:** Bu proje eğitim ve portföy amaçlı geliştirilmiştir.



## 🌐 English Summary
Below is a brief overview of the project for international viewers.



📋 About the Project

This is a hierarchical Task Management System with three roles: Director, Manager, and Team Member. Each role can create, assign, and track tasks within its authority level.

🎯 Features

Role-based access (Director, Manager, Team Member)

Task creation and assignment

Priority levels (High, Medium, Low)

Task status tracking (Not Started, In Progress, Completed)

Statistics and reporting

🛠️ Technologies

Backend: Java 17, Spring Boot, Spring Data JPA, MS SQL Server, Lombok, Swagger/OpenAPI
Frontend: Angular, TypeScript, RxJS, SCSS

🚀 Setup

Backend: configure application.properties, run with Maven

Frontend: install dependencies with npm install, run with ng serve

👥 Default Users

Director → director / director123

Manager → manager / manager123

Team Member → teammember / team123

🔒 Security

JWT Authentication

Role-Based Access Control (RBAC)

SQL Injection protection with JPA
