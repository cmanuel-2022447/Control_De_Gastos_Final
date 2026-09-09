import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface PerfilData {
  id: number;
  usuario: string;
  correo: string;
  nombre: string | null;
  apellido: string | null;
  genero: string | null;
  foto_url: string | null;
  auth_provider: 'LOCAL' | 'GOOGLE';
  moneda: 'GTQ' | 'USD';
  tema: 'CLARO' | 'OSCURO';
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly apiUrl = 'http://localhost:3000/api/auth/profile';
  private readonly perfilSubject = new BehaviorSubject<PerfilData | null>(null);
  private estadoVersion = 0;
  private readonly temaSubject = new BehaviorSubject<'CLARO' | 'OSCURO'>(
    localStorage.getItem('tema') === 'OSCURO' ? 'OSCURO' : 'CLARO'
  );
  readonly perfil$ = this.perfilSubject.asObservable();
  readonly tema$ = this.temaSubject.asObservable();

  constructor(private http: HttpClient) {}

  obtener(): Observable<PerfilData> {
    const version = this.estadoVersion;
    const userId = this.usuarioActualId();
    return this.http.get<PerfilData>(this.apiUrl).pipe(
      tap((perfil) => {
        if (version === this.estadoVersion && perfil.id === userId) this.actualizarEstado(perfil);
      })
    );
  }

  actualizar(data: Partial<PerfilData>): Observable<PerfilData> {
    const version = this.estadoVersion;
    const userId = this.usuarioActualId();
    return this.http.put<PerfilData>(this.apiUrl, data).pipe(
      tap((perfil) => {
        if (version === this.estadoVersion && perfil.id === userId) this.actualizarEstado(perfil);
      })
    );
  }

  resolverAvatar(perfil: Pick<PerfilData, 'rol' | 'foto_url' | 'genero' | 'auth_provider'> | null): string | null {
    if (!perfil) return null;
    if (perfil.foto_url) return perfil.foto_url;
    if (perfil.rol.toUpperCase() === 'ADMIN') return 'assets/img/Admin.png';
    if (perfil.genero === 'FEMENINO') return 'assets/img/Mujer.png';
    if (perfil.genero === 'MASCULINO') return 'assets/img/Hombre.png';
    return null;
  }

  private actualizarEstado(perfil: PerfilData): void {
    this.perfilSubject.next(perfil);
    this.temaSubject.next(perfil.tema);
    localStorage.setItem('tema', perfil.tema);
  }

  limpiarEstado(preservarPerfil = true): void {
    this.estadoVersion += 1;
    if (!preservarPerfil) this.perfilSubject.next(null);
  }

  private usuarioActualId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
      const id = Number(JSON.parse(atob(padded)).id);
      return Number.isFinite(id) ? id : null;
    } catch {
      return null;
    }
  }
}
