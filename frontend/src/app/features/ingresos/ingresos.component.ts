import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { StrictInputDirective } from '../../shared/strict-input.directive';
import { IngresosService, IngresoData } from '../../core/services/ingresos.service';
import { PerfilService } from '../../core/services/perfil.service';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule, AppShellComponent, StrictInputDirective],
  templateUrl: './ingresos.html',
  styleUrl: './ingresos.css'
})
export class IngresosComponent implements OnInit, OnDestroy {
  readonly tasaCambio = 7.68;
  moneda: 'GTQ' | 'USD' = 'GTQ';
  mostrarFormulario = false;
  mensaje = '';
  errorMessage = '';
  editandoId: number | null = null;
  nuevoIngreso = this.formularioVacio();

  ingresos: Ingreso[] = [];
  
  private destroy$ = new Subject<void>();
  private notificationTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private ingresosService: IngresosService,
    private cdr: ChangeDetectorRef,
    private perfilService: PerfilService
  ) {}

  ngOnInit(): void {
    this.perfilService.moneda$.pipe(takeUntil(this.destroy$)).subscribe((moneda) => {
      this.moneda = moneda;
      this.cdr.markForCheck();
    });
    // Suscribirse a los ingresos del servicio compartido
    this.ingresosService.ingresos$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ingresos) => {
        this.ingresos = this.convertirAlFormatoLocal(ingresos);
        // Fuerza detección de cambios porque usamos provideZonelessChangeDetection()
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get ingresosFiltrados(): Ingreso[] {
    return this.ingresos;
  }

  get totalQuetzales(): number {
    return this.ingresos.reduce((total, ingreso) => total + this.aQuetzales(ingreso), 0);
  }

  get simboloMoneda(): string { return this.moneda === 'USD' ? '$' : 'Q'; }

  convertirIngreso(ingreso: Ingreso): number {
    const quetzales = this.aQuetzales(ingreso);
    return this.moneda === 'USD' ? quetzales / this.tasaCambio : quetzales;
  }

  get montoConvertido(): number {
    const monto = Number(this.nuevoIngreso.monto) || 0;
    if (this.nuevoIngreso.moneda === this.nuevoIngreso.monedaDestino) return monto;
    if (this.nuevoIngreso.moneda === 'USD' && this.nuevoIngreso.monedaDestino === 'GTQ') {
      return monto * this.tasaCambio;
    }
    if (this.nuevoIngreso.moneda === 'GTQ' && this.nuevoIngreso.monedaDestino === 'USD') {
      return monto / this.tasaCambio;
    }
    return monto;
  }

  get tasaReferencia(): string {
    const origen = this.nuevoIngreso.moneda;
    const destino = this.nuevoIngreso.monedaDestino;

    if (origen === destino) return `1 ${origen} = 1 ${destino}`;
    if (origen === 'USD' && destino === 'GTQ') return `1 USD = Q ${this.tasaCambio.toFixed(2)}`;
    if (origen === 'GTQ' && destino === 'USD') return `1 GTQ = $ ${(1 / this.tasaCambio).toFixed(4)}`;
    return `1 ${origen} = 1 ${destino}`;
  }

  aQuetzales(ingreso: Ingreso): number {
    return ingreso.moneda === 'USD' ? Number(ingreso.montoQuetzales ?? Number(ingreso.monto) * this.tasaCambio) : Number(ingreso.monto);
  }

  obtenerMontoConvertido(ingreso: Ingreso): number {
    const conversion = this.parseMonedaMonto((ingreso as any).conversion || `${ingreso.monedaDestino} ${this.montoConvertidoParaIngreso(ingreso)}`);
    return conversion.monto || this.montoConvertidoParaIngreso(ingreso);
  }

  private montoConvertidoParaIngreso(ingreso: Ingreso): number {
    if (ingreso.moneda === ingreso.monedaDestino) return Number(ingreso.monto);
    if (ingreso.moneda === 'USD' && ingreso.monedaDestino === 'GTQ') return Number(ingreso.monto) * this.tasaCambio;
    if (ingreso.moneda === 'GTQ' && ingreso.monedaDestino === 'USD') return Number(ingreso.monto) / this.tasaCambio;
    return Number(ingreso.monto);
  }

  private parseMonedaMonto(valor: string): { moneda: string; monto: number } {
    const texto = String(valor || '').trim();
    if (!texto) return { moneda: '', monto: 0 };

    const partes = texto.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return {
        moneda: String(partes[0]).toUpperCase(),
        monto: Number(partes[1]) || 0
      };
    }

    return { moneda: '', monto: Number(texto) || 0 };
  }

  abrirFormulario(): void {
    this.editandoId = null;
    this.nuevoIngreso = this.formularioVacio();
    this.mostrarFormulario = true;
  }

  editarIngreso(ingreso: Ingreso): void {
    this.editandoId = ingreso.id;
    this.nuevoIngreso = { ...ingreso };
    this.mostrarFormulario = true;
  }

  guardarIngreso(): void {
    const monto = String(this.nuevoIngreso.monto ?? '').trim();
    const textoValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,:'()/&-]+$/;
    if (!this.nuevoIngreso.descripcion || !textoValido.test(this.nuevoIngreso.descripcion) || !this.nuevoIngreso.lugar || !textoValido.test(this.nuevoIngreso.lugar) || this.nuevoIngreso.fecha !== this.fechaLocal() || !/^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/.test(monto) || /^0(?:\.0{1,3})?$/.test(monto)) {
      this.errorMessage = this.nuevoIngreso.fecha !== this.fechaLocal() ? 'Los ingresos solo pueden registrarse con la fecha de hoy.' : !/^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/.test(monto) ? 'El monto no puede tener más de 3 decimales.' : 'Completa los campos con el formato indicado y un monto mayor que cero.';
      return;
    }
    this.errorMessage = '';

    const payload = {
      ...this.nuevoIngreso,
      fecha: String(this.nuevoIngreso.fecha).slice(0, 10),
      moneda: this.nuevoIngreso.moneda,
      monto
    };

    this.ingresosService.guardarIngreso(payload, this.editandoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const estabaEditando = this.editandoId !== null;
          this.cerrarFormulario();
          this.mensaje = estabaEditando ? 'Ingreso actualizado correctamente.' : 'Ingreso guardado correctamente.';
          this.mostrarNotificacionTemporal();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'No fue posible guardar el ingreso.';
          console.error('Error guardando ingreso:', err);
        }
      });
  }

  eliminarIngreso(id: number): void {
    this.ingresosService.eliminarIngreso(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error eliminando ingreso:', err)
      });
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.editandoId = null;
    this.nuevoIngreso = this.formularioVacio();
  }

  private mostrarNotificacionTemporal(): void {
    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(() => {
      this.mensaje = '';
      this.cdr.markForCheck();
    }, 3500);
  }

  private convertirAlFormatoLocal(ingresos: IngresoData[]): Ingreso[] {
    return ingresos.map(ing => ({
      id: ing.id,
      fecha: ing.fecha,
      descripcion: ing.descripcion,
      lugar: ing.lugar,
      moneda: ing.moneda,
      monedaDestino: ing.monedaDestino,
      monto: ing.monto,
      montoQuetzales: ing.montoQuetzales,
      conversion: ing.conversion
    }));
  }

  private formularioVacio(): Ingreso {
    return { id: 0, fecha: this.fechaLocal(), descripcion: '', lugar: '', moneda: 'GTQ', monedaDestino: 'USD', monto: '0', montoQuetzales: '0' };
  }

  private fechaLocal(): string {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }
}

interface Ingreso {
  id: number;
  fecha: string;
  descripcion: string;
  lugar: string;
  moneda: 'GTQ' | 'USD';
  monedaDestino: 'GTQ' | 'USD';
  monto: string;
  montoQuetzales: string;
  conversion?: string;
}