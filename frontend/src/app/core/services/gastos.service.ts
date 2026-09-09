import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface GastoData {
  id: number;
  fecha: string;
  descripcion: string;
  lugar?: string | null;
  categoria: string;
  tipo: 'FIJO' | 'VARIABLE';
  monto: number;
  moneda: 'GTQ' | 'USD';
  total_deuda?: number | null;
}

@Injectable({ providedIn: 'root' })
export class GastosService {
  private readonly apiUrl = 'http://localhost:3000/api/expensive';
  private readonly gastosSubject = new BehaviorSubject<GastoData[]>([]);
  private activeSessionKey: string | null = null;
  readonly gastos$ = this.gastosSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.session$.subscribe((sessionKey) => {
      this.activeSessionKey = sessionKey;
      this.gastosSubject.next([]);
      if (sessionKey) {
        this.recargarGastos().subscribe({ error: () => this.gastosSubject.next([]) });
      }
    });
  }

  recargarGastos(): Observable<GastoData[]> {
    const sessionKey = this.activeSessionKey;
    return this.http.get<GastoData[]>(this.apiUrl).pipe(
      tap((gastos) => {
        if (this.activeSessionKey === sessionKey) this.gastosSubject.next(gastos || []);
      })
    );
  }

  guardarGasto(gasto: Omit<GastoData, 'id'>): Observable<any> {
    return this.http.post(this.apiUrl, gasto).pipe(
      tap(() => this.recargarGastos().subscribe())
    );
  }

  actualizarGasto(id: number, gasto: Omit<GastoData, 'id'>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, gasto).pipe(
      tap(() => this.recargarGastos().subscribe())
    );
  }

  eliminarGasto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.recargarGastos().subscribe())
    );
  }
}
