import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardSummary {
  totalIngresos: number;
  totalGastos: number;
  dineroRestante: number;
  gastosFijos: number;
  deudaPendiente: number;
  presupuestoEvento: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = 'http://localhost:3000/api/dashboard';

  constructor(private http: HttpClient) {}

  obtenerResumen(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }
}
