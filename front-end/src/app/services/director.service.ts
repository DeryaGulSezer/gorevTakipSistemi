import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GorevDto } from './gorev.service';

@Injectable({ providedIn: 'root' })
export class DirectorService {
  private apiUrl = 'http://localhost:8080/api/director';

  constructor(private http: HttpClient) {}

  getDirectorTasks(directorId: number): Observable<GorevDto[]> {
    return this.http.get<GorevDto[]>(`${this.apiUrl}/tasks/${directorId}`);
  }
}
