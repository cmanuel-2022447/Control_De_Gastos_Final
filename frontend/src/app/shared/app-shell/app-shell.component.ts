import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, Subscription, forkJoin, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { GastoData, GastosService } from '../../core/services/gastos.service';
import { EventoData, EventosService } from '../../core/services/eventos.service';
import { IngresoData, IngresosService } from '../../core/services/ingresos.service';
import { PerfilData, PerfilService } from '../../core/services/perfil.service';

type ResultadoBusqueda = {
  texto: string;
  selector: string;
  ruta: string;
};

type ContenidoBuscable = string | ResultadoBusqueda;

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css'
})
export class AppShellComponent implements OnInit, OnDestroy {
  @Input() activePage = '';
  @Input() searchableContent: ContenidoBuscable[] = [];
  configuracionesAbiertas = false;
  perfilAbierto = false;
  modoOscuro = false;
  busqueda = '';
  perfilActual: PerfilData | null = null;
  perfilCargando = true;
  fotoPerfilConError = false;

  private readonly registrosEnBusqueda: ResultadoBusqueda[] = [];
  private gastosActuales: GastoData[] = [];
  private eventosActuales: EventoData[] = [];
  private sincronizacionSubscription?: Subscription;

  private readonly informacionPorPagina: Record<string, string[]> = {
    dashboard: ['Dashboard', 'Resumen de hoy', 'Dinero restante', 'Ingresos', 'Gastos', 'Presupuesto para el evento', 'Extras'],
    ingresos: ['Ingresos', 'Historial de ingresos', 'Total registrado', 'Tasa de cambio', 'Descripción', 'Lugar', 'Fecha', 'Original', 'Conversion'],
    gastos: ['Gastos', 'Estos son los gastos', 'Resumen de gastos', 'Presupuesto'],
    'planificar-evento': ['Planificar evento', 'Presupuesto del evento', 'Lista de tareas', 'Invitados'],
    perfil: ['Perfil', 'Configuración', 'Usuario', 'Correo', 'Rol'],
    ayuda: ['Ayuda', 'Soporte', 'Guía', 'Tutorial', 'Preguntas frecuentes']
  };

  private readonly selectoresPorPagina: Record<string, Record<string, { selector: string; ruta: string }>> = {
    dashboard: {
      dashboard: { selector: '#dashboard-section', ruta: '/dashboard' },
      'resumen de hoy': { selector: '#resumen-hoy', ruta: '/dashboard' },
      'dinero restante': { selector: '#resumen-hoy', ruta: '/dashboard' },
      ingresos: { selector: '#resumen-hoy', ruta: '/dashboard' },
      gastos: { selector: '#resumen-hoy', ruta: '/dashboard' },
      'presupuesto para el evento': { selector: '#extras-section', ruta: '/dashboard' },
      extras: { selector: '#extras-section', ruta: '/dashboard' }
    },
    ingresos: {
      ingresos: { selector: '#ingresos-header', ruta: '/ingresos' },
      'historial de ingresos': { selector: '#historial-ingresos', ruta: '/ingresos' },
      'total registrado': { selector: '#resumen-ingresos', ruta: '/ingresos' },
      'tasa de cambio': { selector: '#resumen-ingresos', ruta: '/ingresos' },
      descripción: { selector: '#historial-ingresos', ruta: '/ingresos' },
      lugar: { selector: '#historial-ingresos', ruta: '/ingresos' },
      fecha: { selector: '#historial-ingresos', ruta: '/ingresos' },
      original: { selector: '#historial-ingresos', ruta: '/ingresos' },
      conversion: { selector: '#historial-ingresos', ruta: '/ingresos' }
    },
    gastos: {
      gastos: { selector: '#gastos-header', ruta: '/gastos' },
      presupuesto: { selector: '#gastos-header', ruta: '/gastos' }
    },
    'planificar-evento': {
      'planificar evento': { selector: '#evento-header', ruta: '/planificar-evento' },
      'presupuesto del evento': { selector: '#evento-header', ruta: '/planificar-evento' }
    },
    perfil: {
      perfil: { selector: '#perfil-header', ruta: '/perfil' },
      configuración: { selector: '#perfil-header', ruta: '/perfil' },
      usuario: { selector: '#perfil-header', ruta: '/perfil' },
      correo: { selector: '#perfil-header', ruta: '/perfil' },
      rol: { selector: '#perfil-header', ruta: '/perfil' }
    },
    ayuda: {
      ayuda: { selector: '#ayuda-header', ruta: '/ayuda' },
      soporte: { selector: '#ayuda-header', ruta: '/ayuda' },
      guía: { selector: '#ayuda-header', ruta: '/ayuda' },
      tutorial: { selector: '#ayuda-header', ruta: '/ayuda' },
      'preguntas frecuentes': { selector: '#ayuda-header', ruta: '/ayuda' }
    }
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private ingresosService: IngresosService,
    private gastosService: GastosService,
    private eventosService: EventosService,
    private perfilService: PerfilService
  ) {
    this.modoOscuro = localStorage.getItem('tema') === 'OSCURO';
  }

  ngOnInit(): void {
    this.perfilService.tema$.subscribe((tema) => {
      this.modoOscuro = tema === 'OSCURO';
    });
    this.perfilService.perfil$.subscribe((perfil) => {
      this.perfilActual = perfil;
      this.perfilCargando = !perfil;
      this.fotoPerfilConError = false;
    });
    this.perfilService.obtener().subscribe({
      next: (perfil) => {
        this.perfilActual = perfil;
        this.perfilCargando = false;
        this.fotoPerfilConError = false;
      },
      error: () => {
        this.perfilCargando = false;
      }
    });
    this.ingresosService.ingresos$.subscribe(() => this.actualizarRegistrosEnBusqueda());
    this.gastosService.gastos$.subscribe((gastos) => {
      this.gastosActuales = gastos;
      this.actualizarRegistrosEnBusqueda();
    });
    this.eventosService.eventos$.subscribe((eventos) => {
      this.eventosActuales = eventos;
      this.actualizarRegistrosEnBusqueda();
    });
    this.perfilService.perfil$.subscribe(() => this.actualizarRegistrosEnBusqueda());

    this.sincronizacionSubscription = timer(0, 3000).pipe(
      switchMap(() => forkJoin({
        ingresos: this.ingresosService.recargarIngresos(),
        gastos: this.gastosService.recargarGastos(),
        eventos: this.eventosService.recargar(),
        perfil: this.perfilService.obtener()
      }).pipe(catchError((error) => {
        console.error('Error sincronizando la búsqueda:', error);
        return EMPTY;
      })))
    ).subscribe({
      error: () => undefined
    });
  }

  ngOnDestroy(): void {
    this.sincronizacionSubscription?.unsubscribe();
  }

  get fotoPerfil(): string | null {
    if (this.perfilCargando || !this.perfilActual) return null;
    const rol = String(this.perfilActual.rol || 'USUARIO').toUpperCase();
    const genero = this.perfilActual.genero || null;
    const perfilBase = {
      rol,
      genero,
      foto_url: this.fotoPerfilConError ? null : this.perfilActual.foto_url,
      auth_provider: this.perfilActual.auth_provider
    };

    const avatar = this.perfilService.resolverAvatar(perfilBase as any);
    if (avatar) return avatar;
    return null;
  }

  marcarErrorFotoPerfil(): void {
    this.fotoPerfilConError = true;
  }

  alternarConfiguraciones(): void {
    this.configuracionesAbiertas = !this.configuracionesAbiertas;
  }

  cambiarTema(modoOscuro: boolean): void {
    this.modoOscuro = modoOscuro;
    const tema = modoOscuro ? 'OSCURO' : 'CLARO';
    localStorage.setItem('tema', tema);
    if (this.perfilActual) {
      this.perfilService.actualizar({ tema }).subscribe();
    }
  }

  alternarPerfil(): void {
    this.perfilAbierto = !this.perfilAbierto;
  }

  get datosPerfil(): { nombre: string; apellido: string; usuario: string; correo: string; genero: string; rol: string } {
    const token = this.authService.decodificarPayload() || {};
    return {
      nombre: this.perfilActual?.nombre || token.nombre || 'Usuario',
      apellido: this.perfilActual?.apellido || token.apellido || '',
      usuario: this.perfilActual?.usuario || token.usuario || 'Sin usuario',
      correo: this.perfilActual?.correo || token.email || 'Sin correo',
      genero: this.perfilActual?.genero || '',
      rol: this.perfilActual?.rol || token.rol || localStorage.getItem('rol') || 'USUARIO'
    };
  }

  get resultadosBusqueda(): ResultadoBusqueda[] {
    const consulta = this.busqueda.trim().toLowerCase();
    if (!consulta) return [];

    const contenidoBuscable = [
      ...Object.values(this.informacionPorPagina).flat(),
      ...(this.searchableContent || []),
      ...this.registrosEnBusqueda
    ];
    const vistos = new Set<string>();

    return contenidoBuscable
      .map(item => this.normalizarResultado(item))
      .filter(resultado => {
        const coincide = resultado.texto.toLowerCase().includes(consulta);
        if (!coincide) return false;

        const clave = resultado.texto.trim().toLowerCase();
        if (vistos.has(clave)) return false;
        vistos.add(clave);
        return true;
      })
      .slice(0, 8);
  }

  get busquedaResaltada(): string {
    const consulta = this.busqueda.trim();
    if (!consulta) return '';
    return consulta;
  }

  private normalizarResultado(item: ContenidoBuscable): ResultadoBusqueda {
    if (typeof item === 'string') {
      return this.obtenerResultado(item);
    }

    return {
      texto: item.texto || '',
      selector: item.selector || this.obtenerResultado(item.texto || '').selector,
      ruta: item.ruta || this.obtenerResultado(item.texto || '').ruta
    };
  }

  private actualizarRegistrosEnBusqueda(): void {
    const resultados: ResultadoBusqueda[] = [
      ...this.construirResultadosDesdeIngresos(this.ingresosService.obtenerIngresosActuales()),
      ...this.construirResultadosDesdeGastos(this.gastosActuales),
      ...this.construirResultadosDesdeEventos(this.eventosActuales),
      ...this.construirResultadoDesdePerfil(this.perfilActual)
    ];
    this.registrosEnBusqueda.length = 0;
    this.registrosEnBusqueda.push(...resultados);
  }

  private construirResultadosDesdeIngresos(ingresos: IngresoData[]): ResultadoBusqueda[] {
    return ingresos.map((ingreso) => ({
      texto: `Ingreso • ${[ingreso.descripcion, ingreso.lugar, ingreso.fecha, ingreso.original, ingreso.conversion].filter(Boolean).join(' • ')}`,
      selector: `#ingreso-row-${ingreso.id}`,
      ruta: '/ingresos'
    }));
  }

  private construirResultadosDesdeGastos(gastos: GastoData[]): ResultadoBusqueda[] {
    return gastos.map((gasto) => ({
      texto: `Gasto • ${[gasto.descripcion, gasto.lugar, gasto.categoria, gasto.tipo, gasto.fecha, `${gasto.moneda} ${gasto.monto}`, gasto.total_deuda].filter(value => value !== null && value !== undefined && value !== '').join(' • ')}`,
      selector: `#gasto-row-${gasto.id}`,
      ruta: '/gastos'
    }));
  }

  private construirResultadosDesdeEventos(eventos: EventoData[]): ResultadoBusqueda[] {
    return eventos.map((evento) => ({
      texto: `Evento • ${[evento.nombre, evento.tipo, evento.lugar, evento.fecha, evento.invitados, evento.presupuesto, evento.estado].filter(value => value !== null && value !== undefined && value !== '').join(' • ')}`,
      selector: `#evento-row-${evento.id}`,
      ruta: '/planificar-evento'
    }));
  }

  private construirResultadoDesdePerfil(perfil: PerfilData | null): ResultadoBusqueda[] {
    if (!perfil) return [];
    return [{
      texto: `Perfil • ${[perfil.usuario, perfil.correo, perfil.nombre, perfil.apellido, perfil.genero, perfil.moneda, perfil.tema, perfil.rol].filter(Boolean).join(' • ')}`,
      selector: '#perfil-header',
      ruta: '/perfil'
    }];
  }

  private obtenerResultado(texto: string): ResultadoBusqueda {
    const clave = texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    for (const pagina of Object.values(this.selectoresPorPagina)) {
      for (const [claveBase, detalle] of Object.entries(pagina)) {
        const claveBaseNormalizada = claveBase
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!claveBaseNormalizada) continue;
        if (clave.includes(claveBaseNormalizada) || claveBaseNormalizada.includes(clave)) {
          return {
            texto,
            selector: detalle.selector,
            ruta: detalle.ruta
          };
        }
      }
    }

    return { texto, selector: '', ruta: this.activePage ? `/${this.activePage}` : '/' };
  }

  irAResultado(resultado: ResultadoBusqueda): void {
    const selector = resultado.selector;
    const ruta = resultado.ruta || `/${this.activePage}`;

    const navegarYScroll = () => {
      const elemento = document.querySelector(selector) as HTMLElement | null;
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elemento.focus();
      }
      this.busqueda = '';
    };

    if (ruta !== this.router.url) {
      this.router.navigateByUrl(ruta).then(() => {
        setTimeout(navegarYScroll, 150);
      });
      return;
    }

    navegarYScroll();
  }

  get nombreBienvenida(): string {
    const token = this.authService.decodificarPayload() || {};
    return this.perfilActual?.nombre || token.nombre || this.datosPerfil.usuario || 'Usuario';
  }

  get etiquetaRol(): string {
    return this.datosPerfil.rol.toUpperCase() === 'ADMIN' ? 'Admin' : 'Usuario';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
