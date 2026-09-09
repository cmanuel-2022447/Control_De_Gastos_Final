import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { IngresosService } from '../../core/services/ingresos.service';
import { GastosService, GastoData } from '../../core/services/gastos.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { EventoData, EventosService } from '../../core/services/eventos.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AppShellComponent],
  template: `
    <app-shell #shell activePage="dashboard" [searchableContent]="dashboardSearchTerms">
      <section class="content financial-content" [class.dark-mode]="shell.modoOscuro" id="dashboard-section">
        <div class="financial-grid">
          <section class="summary-card" id="resumen-hoy">
            <p class="eyebrow">RESUMEN DE HOY</p>
            <article class="balance-card">
              <div>
                <span class="stat-label">DINERO RESTANTE</span>
                <strong>Q {{ dineroRestante | number:'1.2-2' }}</strong>
              </div>
              <img src="assets/img/Dinero.png" alt="Dinero restante" />
            </article>
            <div class="income-chart-block">
              <div class="income-chart" [style.background]="graficaIngresos" role="img" aria-label="Gráfica circular de ingresos y gastos">
                <div class="income-chart-center"><strong>Q {{ dineroRestante | number:'1.2-2' }}</strong><span>Dinero restante</span></div>
              </div>
              <div class="chart-legend">
                <span><i class="legend-income"></i>Ingresos</span>
                <span><i class="legend-expense"></i>Gastos</span>
              </div>
            </div>
            <div class="summary-actions">
              <button type="button" class="summary-action expense-action" routerLink="/gastos">
                <img src="assets/img/Cartera.png" alt="" /> Gastos
              </button>
              <button type="button" class="summary-action income-action" routerLink="/ingresos">
                <img src="assets/img/Conchinito.png" alt="" /> Ingresos
              </button>
            </div>
          </section>

          <section class="extras-card" id="extras-section">
            <div class="extras-heading">
              <h3>EXTRAS</h3>
              <div class="theme-switch">
                <button type="button" [class.selected]="shell.modoOscuro" (click)="shell.cambiarTema(true)"><img src="assets/img/Oscuro.png" alt="" /> Oscuro</button>
                <button type="button" [class.selected]="!shell.modoOscuro" (click)="shell.cambiarTema(false)"><img src="assets/img/Claro.png" alt="" /> Claro</button>
              </div>
            </div>
            <div class="extra-cards">
              <article class="extra-card spent-card">
                <span>Dinero gastado</span>
                <strong>Q {{ dineroGastado | number:'1.2-2' }}</strong>
                <img src="assets/img/Cartera.png" alt="" />
              </article>
              <article class="extra-card debt-card">
                <span>Deuda pendiente<br />registrada</span>
                <strong>Q {{ deudaPendiente | number:'1.2-2' }}</strong>
                <img src="assets/img/Conchinito.png" alt="" />
              </article>
              <article class="extra-card event-card">
                <span>Presupuesto para<br />el evento</span>
                <strong>Q {{ presupuestoEvento | number:'1.2-2' }}</strong>
                <small>Boda</small>
                <img src="assets/img/Globos.png" alt="" />
              </article>
            </div>
            <div class="chart" aria-label="Presupuesto por periodo">
              <div class="bar-item" *ngFor="let barra of barrasPresupuesto">
                <span class="bar" [style.height.%]="barra.porcentaje" [title]="barra.etiqueta + ': Q ' + barra.monto"></span>
                <small>{{ barra.etiqueta }}</small>
                <em>Q {{ barra.monto }}</em>
              </div>
              <div class="bar-item empty-bar" *ngFor="let referencia of barrasVacias" [class.hidden-bar]="barrasPresupuesto.length > 0">
                <span class="bar" title="Sin presupuesto"></span>
                <small>0</small>
                <em>Q 0.00</em>
              </div>
            </div>
          </section>
        </div>
      </section>
    </app-shell>
  `,
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly tasaCambio = 7.68;

  get dashboardSearchTerms(): Array<{ texto: string; selector: string; ruta: string }> {
    return [
      { texto: 'Dashboard', selector: '#dashboard-section', ruta: '/dashboard' },
      { texto: 'Resumen de hoy', selector: '#resumen-hoy', ruta: '/dashboard' },
      { texto: `Dinero restante Q ${this.dineroRestante.toFixed(2)}`, selector: '#resumen-hoy', ruta: '/dashboard' },
      { texto: `Ingresos Q ${this.totalIngresos.toFixed(2)}`, selector: '#resumen-hoy', ruta: '/dashboard' },
      { texto: `Gastos Q ${this.totalGastos.toFixed(2)}`, selector: '#resumen-hoy', ruta: '/dashboard' },
      { texto: `Dinero gastado Q ${this.dineroGastado.toFixed(2)}`, selector: '#extras-section', ruta: '/dashboard' },
      { texto: `Deuda pendiente Q ${this.deudaPendiente.toFixed(2)}`, selector: '#extras-section', ruta: '/dashboard' },
      { texto: `Presupuesto para el evento Q ${this.presupuestoEvento.toFixed(2)}`, selector: '#extras-section', ruta: '/dashboard' },
      { texto: 'Extras', selector: '#extras-section', ruta: '/dashboard' },
      { texto: `Ingresos ${this.porcentajeIngresos}%`, selector: '#resumen-hoy', ruta: '/dashboard' }
    ];
  }

  totalIngresos = 0;
  totalGastos = 0;
  dineroRestante = 0;
  dineroGastado = 0;
  gastosFijos = 0;
  deudaPendiente = 0;
  presupuestoEvento = 0;
  porcentajeIngresos = 0;
  graficaIngresos = 'conic-gradient(#194c84 0 0%, #9fd7e8 0% 100%)';
  barrasPresupuesto: Array<{ etiqueta: string; monto: string; porcentaje: number }> = [];
  readonly barrasVacias = [0, 1, 2];
  private eventosActuales: EventoData[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private ingresosService: IngresosService,
    private gastosService: GastosService,
    private dashboardService: DashboardService,
    private eventosService: EventosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarResumenRemoto();
    this.eventosService.eventos$
      .pipe(takeUntil(this.destroy$))
      .subscribe((eventos) => {
        this.actualizarBarras(eventos);
        this.cargarResumenRemoto();
        this.cdr.markForCheck();
      });
    // Suscribirse a los cambios de ingresos desde el servicio compartido
    this.ingresosService.ingresos$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ingresos) => {
        this.totalIngresos = this.calcularTotalIngresos(ingresos);
        this.actualizarDineroRestante();
        this.actualizarGrafica();
        this.cdr.markForCheck();
        this.cargarResumenRemoto();
      });

    this.gastosService.gastos$
      .pipe(takeUntil(this.destroy$))
      .subscribe((gastos) => {
        this.totalGastos = this.calcularTotalGastos(gastos);
        this.dineroGastado = this.totalGastos;
        this.gastosFijos = 0;
        this.deudaPendiente = 0;
        this.actualizarDineroRestante();
        this.actualizarGrafica();
        this.actualizarBarras();
        // Fuerza detección de cambios porque usamos provideZonelessChangeDetection()
        this.cdr.markForCheck();
        this.cargarResumenRemoto();
      });
  }

  private cargarResumenRemoto(): void {
    this.dashboardService.obtenerResumen().subscribe({
      next: (resumen) => {
        this.totalIngresos = resumen.totalIngresos;
        this.totalGastos = resumen.totalGastos;
        this.dineroRestante = resumen.dineroRestante;
        this.dineroGastado = resumen.totalGastos;
        this.gastosFijos = resumen.gastosFijos;
        this.deudaPendiente = resumen.deudaPendiente;
        this.presupuestoEvento = resumen.presupuestoEvento;
        this.actualizarGrafica();
        this.actualizarBarras();
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck()
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calcularTotalIngresos(ingresos: any[]): number {
    if (!ingresos?.length) return 0;

    return ingresos.reduce((total, ingreso) => {
      const monto = ingreso.monto || 0;
      const moneda = ingreso.moneda || 'GTQ';

      if (moneda === 'USD') {
        return total + (Number(monto || 0) * this.tasaCambio);
      }

      return total + Number(monto || 0);
    }, 0);
  }

  private calcularTotalGastos(gastos: GastoData[]): number {
    return (gastos || []).reduce((total, gasto) => {
      const monto = Number(gasto.monto || 0);
      return total + (gasto.moneda === 'USD' ? monto * this.tasaCambio : monto);
    }, 0);
  }

  private actualizarDineroRestante(): void {
    this.dineroRestante = this.totalIngresos - this.totalGastos;
  }

  private actualizarGrafica(): void {
    const totalBase = this.totalIngresos + this.totalGastos;
    this.porcentajeIngresos = totalBase > 0 ? Math.round((this.totalIngresos / totalBase) * 100) : 0;
    this.graficaIngresos = `conic-gradient(#194c84 0 ${this.porcentajeIngresos}%, #9fd7e8 ${this.porcentajeIngresos}% 100%)`;
  }

  private actualizarBarras(eventos?: EventoData[]): void {
    if (eventos) this.eventosActuales = eventos;

    const eventosActivos = this.eventosActuales.filter((evento) => evento.estado?.toUpperCase() !== 'CANCELADO');
    const presupuestos = eventosActivos.map((evento) => Number(evento.presupuesto) || 0);
    const presupuestoMaximo = Math.max(...presupuestos, 0);

    this.barrasPresupuesto = eventosActivos.map((evento) => {
      const presupuesto = Number(evento.presupuesto) || 0;
      return {
        etiqueta: evento.nombre,
        monto: presupuesto.toFixed(2),
        porcentaje: presupuestoMaximo > 0 ? (presupuesto / presupuestoMaximo) * 100 : 0
      };
    });
  }

  private resetearTotales(): void {
    this.totalIngresos = 0;
    this.totalGastos = 0;
    this.dineroRestante = 0;
    this.dineroGastado = 0;
    this.gastosFijos = 0;
    this.deudaPendiente = 0;
    this.presupuestoEvento = 0;
    this.porcentajeIngresos = 0;
    this.graficaIngresos = 'conic-gradient(#194c84 0 0%, #9fd7e8 0% 100%)';
    this.barrasPresupuesto = [];
  }
}
