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
  foto_origen: 'NONE' | 'GOOGLE' | 'MANUAL';
  auth_provider: 'LOCAL' | 'GOOGLE';
  moneda: 'GTQ' | 'USD';
  tema: 'CLARO' | 'OSCURO';
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly apiUrl = 'http://localhost:3000/api/auth/profile';
  private readonly perfilSubject = new BehaviorSubject<PerfilData | null>(null);
  private readonly monedaSubject = new BehaviorSubject<'GTQ' | 'USD'>('GTQ');
  private estadoVersion = 0;
  private usuarioIdEnEstado: number | null = null;
  private readonly temaSubject = new BehaviorSubject<'CLARO' | 'OSCURO'>(
    this.temaGuardado(this.usuarioActualId())
  );
  readonly perfil$ = this.perfilSubject.asObservable();
  readonly moneda$ = this.monedaSubject.asObservable();
  readonly tema$ = this.temaSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Carga el perfil actual desde el backend y lo sincroniza con el estado local.
  // La validación por versión evita que respuestas viejas sobrescriban la información
  // actual cuando el usuario cambia de sesión o se recarga la app.
  obtener(): Observable<PerfilData> {
    const version = this.estadoVersion;
    const userId = this.usuarioActualId();
    return this.http.get<PerfilData>(this.apiUrl).pipe(
      tap((perfil) => {
        if (version === this.estadoVersion && perfil.id === userId && this.usuarioActualId() === userId) this.actualizarEstado(perfil);
      })
    );
  }

  // Guarda cambios del perfil y actualiza de inmediato el estado observable para que
  // la UI cambie sin esperar recarga manual. Mantiene la consistencia entre backend y frontend.
  actualizar(data: Partial<PerfilData>): Observable<PerfilData> {
    const version = this.estadoVersion;
    const userId = this.usuarioActualId();
    return this.http.put<PerfilData>(this.apiUrl, data).pipe(
      tap((perfil) => {
        if (version === this.estadoVersion && perfil.id === userId && this.usuarioActualId() === userId) this.actualizarEstado(perfil);
      })
    );
  }

  // Determina qué imagen debe mostrarse en la UI.
  // Si la foto del perfil es válida, se usa; de lo contrario, se aplica un avatar por defecto
  // según el rol o el género del usuario para mantener una identidad visual coherente.
  resolverAvatar(perfil: Pick<PerfilData, 'rol' | 'foto_url' | 'genero' | 'auth_provider'> | null): string | null {
    if (!perfil) return null;
    const fotoUrl = perfil.foto_url?.trim();
    if (fotoUrl && this.esFotoValida(fotoUrl)) return fotoUrl;
    if (perfil.rol.toUpperCase() === 'ADMIN') return 'assets/img/Admin.png';
    if (perfil.genero === 'FEMENINO') return 'assets/img/Mujer.png';
    if (perfil.genero === 'MASCULINO') return 'assets/img/Hombre.png';
    return 'assets/img/Perfil.png';
  }

  // Centraliza la actualización del estado observable del perfil, la moneda y el tema.
  // Esto permite que todas las vistas reacten a cambios del usuario sin tener que recargar la página.
  private actualizarEstado(perfil: PerfilData): void {
    this.usuarioIdEnEstado = perfil.id;
    this.perfilSubject.next(perfil);
    this.monedaSubject.next(perfil.moneda === 'USD' ? 'USD' : 'GTQ');
    this.temaSubject.next(perfil.tema);
    localStorage.setItem(this.claveTema(perfil.id), perfil.tema);
  }

  limpiarEstado(preservarPerfil = true): void {
    this.estadoVersion += 1;
    if (!preservarPerfil) {
      this.perfilSubject.next(null);
      this.usuarioIdEnEstado = null;
      this.temaSubject.next(this.temaGuardado(this.usuarioActualId()));
    }
  }

  private claveTema(userId: number): string { return `tema:${userId}`; }

  private temaGuardado(userId: number | null): 'CLARO' | 'OSCURO' {
    if (userId === null) return 'CLARO';
    return localStorage.getItem(this.claveTema(userId)) === 'OSCURO' ? 'OSCURO' : 'CLARO';
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

  private esFotoValida(foto: string): boolean {
    if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=]+$/i.test(foto)) return foto.length <= 3_000_000;
    try { return new URL(foto).protocol === 'https:'; } catch { return false; }
  }
}
