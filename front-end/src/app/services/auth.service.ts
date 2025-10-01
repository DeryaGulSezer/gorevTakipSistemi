import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

// Interfaces
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role?: 'DIRECTOR' | 'MANAGER' | 'TEAM_MEMBER';
}

export interface LoginResponse {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: 'DIRECTOR' | 'MANAGER' | 'TEAM_MEMBER';
  token: string;
  message: string;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'DIRECTOR' | 'MANAGER' | 'TEAM_MEMBER';
  isActive: boolean;
  managerId?: number; // Hiyerarşik yapı için
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private tokenKey = 'auth_token';
  
  // Current user state
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Login state
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🏗️ AuthService constructor çalıştı');
    
    // Stored token kontrolü
    this.checkStoredToken();
  }

  /**
   * Kullanıcı girişi
   */
  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginRequest)
      .pipe(
        tap(response => {
          if (response.token) {
            // Token'ı localStorage'a kaydet
            localStorage.setItem(this.tokenKey, response.token);
            
            // User state'ini güncelle
            const user: UserDto = {
              id: response.userId,
              username: response.username,
              email: response.email,
              fullName: response.fullName,
              role: response.role,
              isActive: true,
              managerId: undefined // Backend'ten gelirse eklenecek
            };
            
            console.log('🔄 AuthService: User state set ediliyor:', user);
            this.currentUserSubject.next(user);
            this.isLoggedInSubject.next(true);
            console.log('✅ AuthService: User state set edildi');
          }
        })
      );
  }

  /**
   * Kullanıcı kaydı
   */
  register(registerRequest: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, registerRequest)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem(this.tokenKey, response.token);
            
            const user: UserDto = {
              id: response.userId,
              username: response.username,
              email: response.email,
              fullName: response.fullName,
              role: response.role,
              isActive: true,
              managerId: undefined // Backend'ten gelirse eklenecek
            };
            
            this.currentUserSubject.next(user);
            this.isLoggedInSubject.next(true);
          }
        })
      );
  }

  /**
   * Çıkış işlemi
   */
  logout(): Observable<string> {
    const headers = this.getAuthHeaders();
    
    return this.http.post<string>(`${this.apiUrl}/logout`, {}, { headers, responseType: 'text' as 'json' })
      .pipe(
        tap(() => {
          this.clearAuthData();
        })
      );
  }

  /**
   * Mevcut kullanıcı bilgilerini al
   */
  getCurrentUser(): Observable<UserDto> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<UserDto>(`${this.apiUrl}/me`, { headers })
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
        })
      );
  }

  /**
   * Token doğrulama
   */
  validateToken(): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<boolean>(`${this.apiUrl}/validate`, { headers });
  }

  /**
   * Admin kontrolü
   */
  isAdmin(): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<boolean>(`${this.apiUrl}/is-admin`, { headers });
  }

  /**
   * Authentication header'ları hazırla
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.tokenKey);
    
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    
    return new HttpHeaders();
  }

  /**
   * Stored token kontrolü (uygulama başlangıcında)
   */
  private checkStoredToken(): void {
    const token = localStorage.getItem(this.tokenKey);
    console.log('🔍 checkStoredToken çağrıldı, token var mı:', !!token);
    
    if (token) {
      // Token varsa kullanıcı bilgilerini al
      this.getCurrentUser().subscribe({
        next: (user) => {
          // Token geçerli, kullanıcı bilgileri alındı
          console.log('✅ Stored token geçerli, kullanıcı giriş yaptı:', user.username);
          this.isLoggedInSubject.next(true);
        },
        error: (err) => {
          // Token geçersiz, temizle
          console.log('❌ Stored token geçersiz, temizleniyor:', err);
          this.clearAuthData();
        }
      });
    } else {
      console.log('ℹ️ Stored token yok, kullanıcı çıkış yapılmış durumda');
    }
  }

  /**
   * Authentication verilerini temizle
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  /**
   * Token var mı kontrol et
   */
  hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  /**
   * Mevcut kullanıcı director mi? (eski admin)
   */
  isCurrentUserAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.role === 'DIRECTOR' : false;
  }

  /**
   * Mevcut kullanıcı bilgisi (sync)
   */
  getCurrentUserSync(): UserDto | null {
    const user = this.currentUserSubject.value;
    console.log('📱 getCurrentUserSync çağrıldı, user:', user);
    return user;
  }

  /**
   * Giriş yapılmış mı? (sync)
   */
  isLoggedInSync(): boolean {
    return this.isLoggedInSubject.value;
  }

  /**
   * Force logout (hata durumlarında)
   */
  forceLogout(): void {
    this.clearAuthData();
  }
}