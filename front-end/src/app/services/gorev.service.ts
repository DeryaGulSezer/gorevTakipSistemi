import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GorevDto {
  gorevid: number;
  isim: string;
  description: string;
  userid: number;
  priority: string;
  status: string; // "PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"
  reportedToDirector?: boolean; // Arşivlenen görevler direktöre rapor edildi mi?
  assignedById?: number;
  parentTaskId?: number;
  reportDescription?: string; // Müdürün raporlarken yazdığı açıklama
  reportedAt?: string; // Raporlama tarihi
}

@Injectable({
  providedIn: 'root'
})
export class GorevService {
  private apiUrl = 'http://localhost:8080/api/gorev';

  constructor(private http: HttpClient) { }

  /**
   * Tüm görevleri getir (Admin yetkisi)
   */
  tumGorevleriGetir(): Observable<GorevDto[]> {
    return this.http.get<GorevDto[]>(`${this.apiUrl}/tumunu-getir`);
  }

  /**
   * Yeni görev ekle
   */
  gorevEkle(gorev: Omit<GorevDto, 'gorevid'>): Observable<GorevDto> {
    return this.http.post<GorevDto>(`${this.apiUrl}/ekle`, gorev);
  }

  /**
   * Görev sil
   */
  gorevSil(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/sil/${id}`, { responseType: 'text' });
  }

  /**
   * Görev güncelle
   */
  gorevGuncelle(id: number, gorev: Omit<GorevDto, 'gorevid'>): Observable<GorevDto> {
    return this.http.put<GorevDto>(`${this.apiUrl}/guncelle/${id}`, gorev);
  }

  /**
   * ID'ye göre tek görev getir
   * Backend'de tek görev endpoint'i yoksa tüm görevler içinden filtrele
   */
  gorevGetirById(id: number): Observable<GorevDto | null> {
    return this.tumGorevleriGetir().pipe(
      map(gorevler => gorevler.find(gorev => gorev.gorevid === id) || null)
    );
  }

  // =============== KULLANICI PANELİ METHOD'LARI ===============

  private userApiUrl = 'http://localhost:8080/api/user/gorev';

  /**
   * Kullanıcının tüm görevlerini öncelik sırasına göre getir
   */
  kullaniciGorevleriGetir(userid: number): Observable<GorevDto[]> {
    return this.http.get<GorevDto[]>(`${this.userApiUrl}/${userid}`);
  }

  /**
   * Kullanıcının aktif (tamamlanmamış) görevlerini getir
   */
  kullaniciAktifGorevleriGetir(userid: number): Observable<GorevDto[]> {
    return this.http.get<GorevDto[]>(`${this.userApiUrl}/${userid}/active`);
  }

  /**
   * Kullanıcının belirli durumdaki görevlerini getir
   */
  kullaniciGorevleriStatuseGore(userid: number, status: string): Observable<GorevDto[]> {
    return this.http.get<GorevDto[]>(`${this.userApiUrl}/${userid}/status/${status}`);
  }

  /**
   * Görevi tamamlandı olarak işaretle
   */
  gorevTamamla(gorevId: number, userid: number): Observable<string> {
    return this.http.put(`${this.userApiUrl}/${gorevId}/complete/${userid}`, {}, { responseType: 'text' });
  }

  /**
   * Görev durumunu güncelle
   */
  gorevDurumGuncelle(gorevId: number, userid: number, status: string): Observable<string> {
    return this.http.put(`${this.userApiUrl}/${gorevId}/status/${userid}`, 
      { status: status }, { responseType: 'text' });
  }

  /**
   * Kullanıcının görev istatistiklerini getir
   */
  kullaniciIstatistikleriGetir(userid: number): Observable<UserTaskStats> {
    return this.http.get<UserTaskStats>(`${this.userApiUrl}/${userid}/stats`);
  }
}

// Kullanıcı görev istatistikleri interface'i
export interface UserTaskStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
}