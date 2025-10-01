import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GorevDto } from './gorev.service';

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: 'DIRECTOR' | 'MANAGER' | 'TEAM_MEMBER';
  managerType?: string; // Müdür tipi (MANAGER rolü için)
  managerId?: number; // Ekip üyesi oluşturulurken hangi müdüre atanacağı
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullName?: string;
  role?: 'DIRECTOR' | 'MANAGER' | 'TEAM_MEMBER';
  managerType?: string; // Müdür tipi
  isActive?: boolean;
  managerId?: number; // Müdür atama/değiştirme
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'DIRECTOR' | 'MANAGER' | 'TEAM_MEMBER';
  managerType?: string; // Müdür tipi
  isActive?: boolean;
  managerId?: number; // Hiyerarşik yapı için
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) {}

  /**
   * Yeni kullanıcı oluştur
   */
  createUser(request: CreateUserRequest): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/users`, request);
  }

  /**
   * Tüm kullanıcıları listele
   */
  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users`);
  }

  /**
   * Kullanıcı bilgilerini getir
   */
  getUserById(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/users/${id}`);
  }

  /**
   * Kullanıcı bilgilerini güncelle
   */
  updateUser(id: number, request: UpdateUserRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/users/${id}`, request);
  }

  /**
   * Kullanıcıyı sil
   */
  deleteUser(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, { responseType: 'text' });
  }

  /**
   * Tüm müdürleri getir (ekip üyesi atarken kullanmak için)
   */
  getAllManagers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/managers`);
  }

  /**
   * Direktöre rapor edilen görevleri getir
   */
  getReportedTasks(): Observable<GorevDto[]> {
    return this.http.get<GorevDto[]>(`${this.apiUrl}/reported-tasks`);
  }
}