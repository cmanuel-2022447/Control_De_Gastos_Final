import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface IngresoData {
  id: number;
  fecha: string;
  descripcion: string;
  lugar: string;
  moneda: 'GTQ' | 'USD';
  monedaDestino: 'GTQ' | 'USD';
  monto: number;
  montoQuetzales: number;
  original?: string;
  conversion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IngresosService {
  private readonly apiUrl = 'http://localhost:3000/api/ingresos';
  private readonly ingresosSubject = new BehaviorSubject<IngresoData[]>([]);
  
  public readonly ingresos$ = this.ingresosSubject.asObservable();
  
  private ingresosCache$: Observable<IngresoData[]> | null = null;
  private activeSessionKey: string | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.session$.subscribe((sessionKey) => {
      this.activeSessionKey = sessionKey;
      this.ingresosCache$ = null;
      this.ingresosSubject.next([]);
      if (sessionKey) this.cargarIngresosInicial(sessionKey);
    });
  }

  /**
   * Carga inicial de ingresos desde la base de datos
   */
  private cargarIngresosInicial(sessionKey: string): void {
    this.obtenerIngresosDelServidor().subscribe(
      (data) => {
        if (this.activeSessionKey === sessionKey) {
          this.ingresosSubject.next(this.transformarIngresos(data));
        }
      },
      (error) => {
        console.error('Error cargando ingresos iniciales:', error);
        this.ingresosSubject.next([]);
      }
    );
  }

  /**
   * Obtiene los ingresos desde el servidor con caché
   */
  private obtenerIngresosDelServidor(): Observable<any[]> {
    if (!this.ingresosCache$) {
      this.ingresosCache$ = this.http.get<any[]>(this.apiUrl).pipe(
        shareReplay(1)
      );
    }
    return this.ingresosCache$;
  }

  /**
   * Recarga los ingresos desde el servidor
   */
  public recargarIngresos(): Observable<IngresoData[]> {
    const sessionKey = this.activeSessionKey;
    this.ingresosCache$ = null;
    return this.obtenerIngresosDelServidor().pipe(
      tap((data) => {
        if (this.activeSessionKey === sessionKey) {
          const ingresosTransformados = this.transformarIngresos(data);
          this.ingresosSubject.next(ingresosTransformados);
        }
      })
    );
  }

  /**
   * Guarda un nuevo ingreso o actualiza uno existente
   */
  public guardarIngreso(ingreso: any, id?: number | null): Observable<any> {
    const payload = this.prepararPayload(ingreso);
    
    const request = id === null || id === undefined
      ? this.http.post<any>(this.apiUrl, payload)
      : this.http.put<any>(`${this.apiUrl}/${id}`, payload);

    return request.pipe(
      tap(() => {
        // Recarga los ingresos después de guardar
        this.recargarIngresos().subscribe();
      })
    );
  }

  /**
   * Elimina un ingreso
   */
  public eliminarIngreso(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Recarga los ingresos después de eliminar
        this.recargarIngresos().subscribe();
      })
    );
  }

  /**
   * Obtiene los ingresos actuales del Subject (estado local)
   */
  public obtenerIngresosActuales(): IngresoData[] {
    return this.ingresosSubject.value;
  }

  /**
   * Transforma los datos crudos del servidor al formato esperado
   */
  private transformarIngresos(data: any[]): IngresoData[] {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((ingreso) => {
      const original = String(ingreso.original || '').trim();
      const conversion = String(ingreso.conversion || '').trim();
      const originalParsed = this.parseMonedaMonto(original);
      const conversionParsed = this.parseMonedaMonto(conversion);
      const monedaOriginal = (originalParsed.moneda as 'GTQ' | 'USD') || 'GTQ';
      const monedaDestino = (conversionParsed.moneda as 'GTQ' | 'USD') || (monedaOriginal === 'USD' ? 'GTQ' : 'USD');
      const montoOriginal = Number(originalParsed.monto || 0);
      const montoConvertido = Number(conversionParsed.monto || 0);
      const montoQuetzales = monedaOriginal === 'USD' ? montoOriginal * 7.68 : montoOriginal;

      return {
        id: ingreso.id,
        fecha: String(ingreso.fecha ?? '').slice(0, 10),
        descripcion: ingreso.descripcion,
        lugar: ingreso.lugar,
        moneda: monedaOriginal,
        monedaDestino,
        monto: montoOriginal,
        montoQuetzales,
        original: ingreso.original,
        conversion: ingreso.conversion,
        conversionMonto: montoConvertido
      } as any
    });
  }

  private parseMonedaMonto(valor: string): { moneda: string; monto: number } {
    const texto = String(valor || '').trim();
    if (!texto) return { moneda: '', monto: 0 };

    const partes = texto.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return { moneda: String(partes[0]).toUpperCase(), monto: Number(partes[1]) || 0 };
    }

    return { moneda: '', monto: Number(texto) || 0 };
  }

  /**
   * Prepara el payload para enviar al backend
   */
  private prepararPayload(ingreso: any): any {
    const tasaCambio = 7.68;
    const monto = Number(ingreso.monto) || 0;
    const origen = String(ingreso.moneda || 'GTQ').trim().toUpperCase();
    const destino = String(ingreso.monedaDestino || (origen === 'USD' ? 'GTQ' : 'USD')).trim().toUpperCase();
    const montoConvertido = origen === destino
      ? monto
      : origen === 'USD' && destino === 'GTQ'
        ? monto * tasaCambio
        : monto / tasaCambio;

    return {
      ...ingreso,
      fecha: String(ingreso.fecha).slice(0, 10),
      moneda: origen,
      monedaDestino: destino,
      monto,
      tasa_cambio: tasaCambio,
      original: `${origen} ${monto.toFixed(2)}`,
      conversion: `${destino} ${montoConvertido.toFixed(2)}`
    };
  }
}
