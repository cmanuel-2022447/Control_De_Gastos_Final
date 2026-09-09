import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface EventoData {
  id: number;
  nombre: string;
  tipo: string;
  invitados?: number | null;
  lugar?: string | null;
  fecha: string;
  presupuesto: number;
  gastado: number;
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly apiUrl = 'http://localhost:3000/api/eventos';
  private readonly eventosSubject = new BehaviorSubject<EventoData[]>([]);
  private activeSessionKey: string | null = null;
  readonly eventos$ = this.eventosSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.session$.subscribe((sessionKey) => {
      this.activeSessionKey = sessionKey;
      this.eventosSubject.next([]);
      if (sessionKey) this.recargar().subscribe({ error: () => this.eventosSubject.next([]) });
    });
  }

  recargar(): Observable<EventoData[]> {
    const sessionKey = this.activeSessionKey;
    return this.http.get<EventoData[]>(this.apiUrl).pipe(
      tap((eventos) => {
        if (this.activeSessionKey === sessionKey) this.eventosSubject.next(eventos || []);
      })
    );
  }

  crear(evento: Omit<EventoData, 'id' | 'gastado' | 'restante' | 'estado'>): Observable<EventoData> {
    return this.http.post<EventoData>(this.apiUrl, evento).pipe(tap(() => this.recargar().subscribe()));
  }

  actualizar(id: number, evento: Partial<EventoData>): Observable<EventoData> {
    return this.http.put<EventoData>(`${this.apiUrl}/${id}`, evento).pipe(tap(() => this.recargar().subscribe()));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(tap(() => this.recargar().subscribe()));
  }

}
