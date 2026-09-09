import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { StrictInputDirective } from '../../shared/strict-input.directive';
import { EventoData, EventosService } from '../../core/services/eventos.service';

@Component({
  selector: 'app-planificar-evento',
  standalone: true,
  imports: [CommonModule, FormsModule, AppShellComponent, StrictInputDirective],
  templateUrl: './planificar-evento.html',
  styleUrl: './planificar-evento.css'
})
export class PlanificarEventoComponent implements OnInit {
  eventos: EventoData[] = [];
  errorMessage = '';
  successMessage = '';
  private notificationTimer: ReturnType<typeof setTimeout> | undefined;
  editando: number | null = null;
  mostrarFormulario = false;
  formulario = { nombre: '', tipo: '', invitados: null as number | null, lugar: '', fecha: new Date().toISOString().slice(0, 10), presupuesto: 0 };

  constructor(private eventosService: EventosService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.eventosService.eventos$.subscribe((eventos) => { this.eventos = eventos; this.cdr.markForCheck(); }); }

  get presupuestoTotal(): number { return this.eventos.reduce((total, evento) => total + Number(evento.presupuesto || 0), 0); }
  get proximosEventos(): number { return this.eventos.filter((evento) => new Date(evento.fecha) >= new Date(new Date().toISOString().slice(0, 10))).length; }

  guardar(): void {
        const textoValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,:'()/&-]+$/;
        if (!textoValido.test(this.formulario.nombre) || !textoValido.test(this.formulario.tipo) || (this.formulario.lugar && !textoValido.test(this.formulario.lugar)) || (this.formulario.invitados !== null && (!Number.isInteger(Number(this.formulario.invitados)) || Number(this.formulario.invitados) < 0)) || !/^\d{4}-\d{2}-\d{2}$/.test(this.formulario.fecha) || !Number.isFinite(Number(this.formulario.presupuesto)) || Number(this.formulario.presupuesto) < 0) {
          this.errorMessage = 'Completa los campos con el formato indicado y valores válidos.';
          return;
        }
    const request = this.editando === null ? this.eventosService.crear(this.formulario) : this.eventosService.actualizar(this.editando, this.formulario);
    request.subscribe({
      next: () => { this.formulario = { ...this.formulario, nombre: '', tipo: '', invitados: null, lugar: '', presupuesto: 0 }; this.editando = null; this.mostrarFormulario = false; this.errorMessage = ''; this.successMessage = 'Evento guardado correctamente.'; this.mostrarNotificacionTemporal(); this.cdr.markForCheck(); },
      error: (error) => { this.errorMessage = error?.error?.message || 'No fue posible guardar el evento.'; this.cdr.markForCheck(); }
    });
  }

  editar(evento: EventoData): void { this.editando = evento.id; this.formulario = { nombre: evento.nombre, tipo: evento.tipo, invitados: evento.invitados ?? null, lugar: evento.lugar || '', fecha: evento.fecha, presupuesto: evento.presupuesto }; this.mostrarFormulario = true; this.successMessage = ''; }
  eliminar(id: number): void { this.eventosService.eliminar(id).subscribe({ error: error => { this.errorMessage = error?.error?.message || 'No fue posible eliminar el evento.'; this.cdr.markForCheck(); } }); }
  abrirFormulario(): void { this.editando = null; this.formulario = { nombre: '', tipo: '', invitados: null, lugar: '', fecha: new Date().toISOString().slice(0, 10), presupuesto: 0 }; this.errorMessage = ''; this.successMessage = ''; this.mostrarFormulario = true; }
  cerrarFormulario(): void { this.mostrarFormulario = false; }

  private mostrarNotificacionTemporal(): void {
    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 3500);
  }
}