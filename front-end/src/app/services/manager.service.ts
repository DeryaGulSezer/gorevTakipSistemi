import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GorevDto } from './gorev.service';

export interface TeamMemberDto {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'DIRECTOR' | 'MANAGER' | 'TEAM_MEMBER';
  isActive?: boolean;
  managerId?: number;
}

export interface TeamPerformanceDto {
  totalTeamMembers: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionRate: number;
}

export interface TaskAssignmentRequest {
  isim: string;
  description: string;
  userid: number;
  priority: string;
  status?: string;
  parentTaskId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ManagerService {
  private apiUrl = 'http://localhost:8080/api/manager';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return new HttpHeaders(headers);
  }

  /**
   * Müdürün ekip üyelerini getir
   */
  getTeamMembers(managerId: number): Observable<TeamMemberDto[]> {
    return this.http.get<TeamMemberDto[]>(`${this.apiUrl}/team-members/${managerId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Müdürün ekibindeki tüm görevleri getir
   */
  getTeamTasks(managerId: number): Observable<GorevDto[]> {
    return this.http.get<GorevDto[]>(`${this.apiUrl}/team-tasks/${managerId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Müdürün kendi görevlerini getir
   */
  getManagerTasks(managerId: number): Observable<GorevDto[]> {
    return this.http.get<GorevDto[]>(`${this.apiUrl}/my-tasks/${managerId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Ekip üyesine görev ata
   */
  assignTask(taskData: TaskAssignmentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign-task`, taskData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Ekip performans özetini getir
   */
  getTeamPerformance(managerId: number): Observable<TeamPerformanceDto> {
    return this.http.get<TeamPerformanceDto>(`${this.apiUrl}/team-performance/${managerId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Görev güncelle
   */
  updateTask(taskId: number, taskData: GorevDto): Observable<TaskOperationResponse> {
    return this.http.put<TaskOperationResponse>(`${this.apiUrl}/update-task/${taskId}`, taskData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Görev sil
   */
  deleteTask(taskId: number): Observable<TaskOperationResponse> {
    return this.http.delete<TaskOperationResponse>(`${this.apiUrl}/delete-task/${taskId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Görev arşivle
   */
  // archiveTask kaldırıldı

  /**
   * Tamamlanan görevleri getir
   */
  getCompletedTasks(managerId: number): Observable<GorevDto[]> {
    return this.http.get<GorevDto[]>(`${this.apiUrl}/completed-tasks/${managerId}`, {
      headers: this.getHeaders()
    });
  }

  reportTasksToDirector(managerId: number, taskIds: number[], description?: string): Observable<ReportResponse> {
    const requestData: ReportRequest = { 
      taskIds,
      ...(description && { description })
    };
    
    return this.http.post<ReportResponse>(`${this.apiUrl}/report-to-director/${managerId}`,
      requestData,
      { headers: this.getHeaders() });
  }

  /**
   * Arşivlenen görevleri getir
   */
  // getArchivedTasks kaldırıldı

  /**
   * Görevleri direktöre rapor et
   */
  // reportTasksToDirector kaldırıldı

}

export interface TaskOperationResponse {
  success: boolean;
  message?: string;
  task?: GorevDto;
}

export interface ReportResponse {
  success: boolean;
  message?: string;
  reportedCount?: number;
}

// Raporlama servisini geri ekle
export interface ReportRequest {
  taskIds: number[];
  description?: string; // Raporlama açıklaması
}
