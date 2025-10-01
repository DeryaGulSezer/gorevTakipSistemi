# Görev Takip Sistemi - Frontend

Angular tabanlı görev yönetim sistemi frontend uygulaması.

## 🛠️ Teknolojiler

- **Angular** 20.1.0
- **TypeScript** 5.8.2
- **RxJS** - Reactive programlama
- **SCSS** - Stil yönetimi
- **Angular Router** - Sayfa yönlendirme
- **HttpClient** - API iletişimi

## 📁 Proje Yapısı

```
src/
├── app/
│   ├── director-panel/       # Direktör paneli komponenti
│   ├── manager-panel/        # Müdür paneli komponenti
│   ├── user-tasks/           # Ekip üyesi görev komponenti
│   ├── login/                # Giriş sayfası
│   ├── user-management/      # Kullanıcı yönetimi
│   ├── all-task/             # Tüm görevler
│   ├── services/
│   │   ├── auth.service.ts        # Kimlik doğrulama servisi
│   │   ├── director.service.ts    # Direktör servisi
│   │   ├── manager.service.ts     # Müdür servisi
│   │   ├── gorev.service.ts       # Görev servisi
│   │   └── admin.service.ts       # Admin servisi
│   ├── guards/
│   │   └── auth.guard.ts          # Route koruma
│   ├── app.routes.ts              # Route tanımları
│   └── app.ts                     # Ana component
└── styles.scss                    # Global stiller
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18 veya üzeri
- npm 9 veya üzeri
- Angular CLI 20.1.0

### Kurulum Adımları

1. **Bağımlılıkları yükleyin:**
```bash
npm install
```

2. **Development sunucusu başlatın:**
```bash
ng serve
```

3. **Tarayıcıda açın:**
```
http://localhost:4200
```

Uygulama otomatik olarak yeniden yüklenecektir.

## 🔐 Kimlik Doğrulama

Sistem JWT token tabanlı kimlik doğrulama kullanır:

- Token `localStorage`'da saklanır
- Her API isteğinde `Authorization` header'ı eklenir
- Token süresi dolduğunda otomatik logout olur
- `AuthGuard` ile korunan route'lar

### Varsayılan Kullanıcılar

| Rol | Kullanıcı Adı | Şifre |
|-----|---------------|-------|
| Direktör | director | director123 |
| Müdür | manager | manager123 |
| Ekip Üyesi | teammember | team123 |

## 📱 Özellikler

### Direktör Paneli
- Tüm görevleri görüntüleme
- Müdürlere görev atama
- Kullanıcı yönetimi (CRUD işlemleri)
- Sistem genelinde raporlama

### Müdür Paneli
- Ekip üyelerine görev atama
- Ekip görevlerini görüntüleme
- Kendi görevlerini yönetme
- Görev silme ve güncelleme
- Otomatik yenileme (30 saniye)

### Ekip Üyesi Paneli
- Atanan görevleri görüntüleme
- Görev durumlarını güncelleme
- Performans istatistikleri
- Otomatik yenileme (30 saniye)

## 🔄 API Entegrasyonu

Backend API: `http://localhost:8080/api`

### Endpoint'ler

#### Auth
- `POST /auth/login` - Giriş
- `POST /auth/logout` - Çıkış
- `GET /auth/current-user` - Mevcut kullanıcı

#### Director
- `GET /director/all-tasks` - Tüm görevler
- `POST /director/assign-task` - Görev ata
- `DELETE /director/delete-task/{id}` - Görev sil

#### Manager
- `GET /manager/team-members` - Ekip üyeleri
- `GET /manager/team-tasks` - Ekip görevleri
- `POST /manager/assign-task` - Görev ata
- `DELETE /manager/delete-task/{id}` - Görev sil

#### User
- `GET /user/my-tasks` - Görevlerim
- `PUT /user/update-task-status/{id}` - Durum güncelle

## 🎨 Stil Sistemi

- **SCSS** kullanılır
- Responsive tasarım
- Modern ve temiz UI
- Rol bazlı renk şeması:
  - Direktör: Mor tonları
  - Müdür: Mavi tonları
  - Ekip Üyesi: Yeşil tonları

## 🧪 Test

Unit testleri çalıştırma:
```bash
ng test
```

## 📦 Production Build

Production için build:
```bash
ng build --configuration production
```

Build dosyaları `dist/` klasöründe oluşur.

## 🔧 Yapılandırma

Backend API URL'sini değiştirmek için servis dosyalarını güncelleyin:

```typescript
// auth.service.ts
private apiUrl = 'http://localhost:8080/api/auth';
```

## 📝 Geliştirme Notları

- TypeScript strict mode aktif
- ESLint kuralları uygulanıyor
- Component bazlı mimari
- Reactive Forms kullanımı
- RxJS operatörleri ile asenkron işlemler

## 🐛 Bilinen Sorunlar

Şu anda bilinen kritik sorun bulunmamaktadır.

## 📄 Lisans

Bu proje kişisel kullanım içindir.

---

**Angular CLI Sürümü:** 20.1.4  
**Angular Sürümü:** 20.1.0
