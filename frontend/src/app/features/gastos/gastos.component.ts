import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { StrictInputDirective } from '../../shared/strict-input.directive';
import { GastosService, GastoData } from '../../core/services/gastos.service';
import { IngresosService, IngresoData } from '../../core/services/ingresos.service';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule, AppShellComponent, StrictInputDirective],
  templateUrl: './gastos.html',
  styleUrl: './gastos.css'
})
export class GastosComponent implements OnInit {
  readonly categorias = ['Alimentación', 'Transporte', 'Vivienda', 'Servicios', 'Educación', 'Salud', 'Deuda', 'Otros'];
  gastos: GastoData[] = [];
  ingresos: IngresoData[] = [];
  mostrarFormulario = false;
  errorMessage = '';
  successMessage = '';
  private notificationTimer: ReturnType<typeof setTimeout> | undefined;
  editandoId: number | null = null;
  formulario: Omit<GastoData, 'id'> = {
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: '', lugar: '', categoria: '', tipo: 'VARIABLE', monto: 0, moneda: 'GTQ'
  };

  constructor(private gastosService: GastosService, private ingresosService: IngresosService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.gastosService.gastos$.subscribe((gastos) => {
      this.gastos = gastos;
      this.cdr.markForCheck();
    });
    this.ingresosService.ingresos$.subscribe((ingresos) => {
      this.ingresos = ingresos;
      this.cdr.markForCheck();
    });
  }

  get totalGastado(): number {
    return this.gastos.reduce((total, gasto) => total + this.aQuetzales(gasto), 0);
  }

  get totalIngresos(): number {
    return this.ingresos.reduce((total, ingreso) => total + (ingreso.moneda === 'USD' ? ingreso.monto * 7.68 : ingreso.monto), 0);
  }

  get totalDeuda(): number {
    const deudasPorNombre = new Map<string, { total: number; pagado: number }>();
    for (const gasto of this.gastos) {
      if (gasto.categoria !== 'Deuda') continue;
      const nombre = `${gasto.categoria}:${gasto.descripcion.trim().toLowerCase()}`;
      const deuda = deudasPorNombre.get(nombre) || { total: 0, pagado: 0 };
      deuda.total = Math.max(deuda.total, Number(gasto.total_deuda) || 0);
      deuda.pagado += this.aQuetzales(gasto);
      deudasPorNombre.set(nombre, deuda);
    }
    return Array.from(deudasPorNombre.values()).reduce((total, deuda) => total + Math.max(deuda.total - deuda.pagado, 0), 0);
  }

  get dineroDisponible(): number {
    return this.totalIngresos - this.totalGastado;
  }

  get dineroDisponibleDespues(): number {
    const monto = Number(this.formulario.monto) || 0;
    return Math.max(this.dineroDisponible - (this.formulario.moneda === 'USD' ? monto * 7.68 : monto), 0);
  }

  get saldoDeudaFormulario(): number {
    return Math.max((this.totalDeudaFormulario || 0) - (Number(this.formulario.monto) || 0), 0);
  }

  get totalDeudaFormulario(): number | null {
    const capturado = Number(this.formulario.total_deuda);
    if (Number.isFinite(capturado) && capturado >= 0) return capturado;
    if (this.formulario.categoria !== 'Deuda' || !this.formulario.descripcion.trim()) return null;
    const nombre = this.formulario.descripcion.trim().toLowerCase();
    return this.gastos
      .filter((gasto) => gasto.categoria === 'Deuda' && gasto.descripcion.trim().toLowerCase() === nombre && gasto.total_deuda !== null && gasto.total_deuda !== undefined)
      .reduce<number | null>((mayor, gasto) => Math.max(mayor || 0, Number(gasto.total_deuda) || 0), null);
  }

  etiquetaTipo(tipo: GastoData['tipo']): string {
    return tipo === 'VARIABLE' ? 'Variable' : 'Fijo';
  }

  cambioTipo(_tipo: GastoData['tipo']): void {}

  cambioCategoria(categoria: string): void {
    if (categoria !== 'Deuda') this.formulario.total_deuda = null;
  }

  aQuetzales(gasto: GastoData): number {
    return gasto.moneda === 'USD' ? gasto.monto * 7.68 : gasto.monto;
  }

  guardar(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const textoValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,:'()/&-]+$/;
    const monto = Number(this.formulario.monto);
    const totalDeuda = this.formulario.total_deuda === null || this.formulario.total_deuda === undefined ? null : Number(this.formulario.total_deuda);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.formulario.fecha) || !this.formulario.categoria || !textoValido.test(this.formulario.descripcion) || (this.formulario.lugar && !textoValido.test(this.formulario.lugar)) || !Number.isFinite(monto) || monto <= 0 || (totalDeuda !== null && (!Number.isFinite(totalDeuda) || totalDeuda < 0))) {
      this.errorMessage = 'Completa los campos con el formato indicado y cantidades válidas.';
      return;
    }
    const estabaEditando = this.editandoId !== null;
    const request = this.editandoId === null
      ? this.gastosService.guardarGasto(this.formulario)
      : this.gastosService.actualizarGasto(this.editandoId, this.formulario);
    request.subscribe({
      next: () => {
        this.formulario = { ...this.formulario, descripcion: '', categoria: '', monto: 0, total_deuda: null };
        this.editandoId = null;
        this.mostrarFormulario = false;
        this.errorMessage = '';
        this.successMessage = estabaEditando ? 'Gasto actualizado correctamente.' : 'Gasto guardado correctamente.';
        this.mostrarNotificacionTemporal();
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'No fue posible guardar el gasto.';
        this.cdr.markForCheck();
      }
    });
  }

  editar(gasto: GastoData): void {
    this.editandoId = gasto.id;
    this.formulario = { ...gasto };
    this.mostrarFormulario = true;
    this.successMessage = '';
  }

  abrirFormulario(): void {
    this.editandoId = null;
    this.formulario = { fecha: new Date().toISOString().slice(0, 10), descripcion: '', lugar: '', categoria: '', tipo: 'VARIABLE', monto: 0, moneda: 'GTQ', total_deuda: null };
    this.errorMessage = '';
    this.successMessage = '';
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  private mostrarNotificacionTemporal(): void {
    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 3500);
  }

  eliminar(id: number): void {
    this.gastosService.eliminarGasto(id).subscribe({
      error: (error) => { this.errorMessage = error?.error?.message || 'No fue posible eliminar el gasto.'; this.cdr.markForCheck(); }
    });
  }
}