import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';
import { StrictInputDirective } from '../../shared/strict-input.directive';
import { PerfilData, PerfilService } from '../../core/services/perfil.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, AppShellComponent, StrictInputDirective],
  template: `<app-shell #shell activePage="perfil"><section class="profile-page" [class.dark-mode]="shell.modoOscuro"><div class="profile-heading"><span class="eyebrow">CUENTA PERSONAL</span><h1 id="perfil-header">Perfil</h1><p>Administra tus datos y preferencias guardadas.</p></div><section class="profile-card" *ngIf="perfil"><ng-container *ngIf="avatar as foto; else avatarNeutro"><img class="profile-photo" [src]="foto" alt="Foto de perfil" /></ng-container><ng-template #avatarNeutro><span class="profile-photo profile-photo-loading" aria-label="Cargando foto de perfil"></span></ng-template><div class="profile-details"><strong>{{ perfil.nombre || 'Usuario' }} {{ perfil.apellido || '' }}</strong><span>{{ perfil.correo }}</span><small>Rol: {{ perfil.rol === 'ADMIN' ? 'Administrador' : 'Usuario' }}</small></div><section *ngIf="esAdmin" class="admin-panel"><span class="eyebrow">ACCESO ESPECIAL</span><h2>Panel de administrador</h2><p>Cuenta con permisos administrativos reconocidos por el backend.</p></section><form (ngSubmit)="guardar()"><label>Nombre<input [(ngModel)]="perfil.nombre" name="nombre" pattern="[A-Za-zÁÉÍÓÚáéíóúÑñÜü .'-]+" maxlength="100" /></label><label>Apellido<input [(ngModel)]="perfil.apellido" name="apellido" pattern="[A-Za-zÁÉÍÓÚáéíóúÑñÜü .'-]+" maxlength="100" /></label><label>Género<select [(ngModel)]="perfil.genero" name="genero" required><option value="FEMENINO">Femenino</option><option value="MASCULINO">Masculino</option></select></label><label>Moneda<select [(ngModel)]="perfil.moneda" name="moneda"><option value="GTQ">Quetzales (GTQ)</option><option value="USD">Dólares (USD)</option></select></label><label>Tema<select [(ngModel)]="perfil.tema" name="tema"><option value="CLARO">Claro</option><option value="OSCURO">Oscuro</option></select></label><button type="submit">Guardar cambios</button></form><p *ngIf="mensaje" class="save-notification" role="status" aria-live="polite">{{ mensaje }}</p><p *ngIf="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p></section></section></app-shell>`,
  styleUrl: './perfil.css'
})
export class PerfilComponent implements OnInit {
  perfil: PerfilData | null = null;
  mensaje = '';
  errorMessage = '';

  constructor(private perfilService: PerfilService, private cdr: ChangeDetectorRef) {}

  get esAdmin(): boolean {
    return this.perfil?.rol?.toUpperCase() === 'ADMIN';
  }

  get avatar(): string | null {
    return this.perfilService.resolverAvatar(this.perfil);
  }

  ngOnInit(): void {
    this.perfilService.obtener().subscribe({
      next: (perfil) => { this.perfil = perfil; this.cdr.markForCheck(); },
      error: (error) => { this.errorMessage = error?.error?.message || 'No fue posible cargar el perfil.'; this.cdr.markForCheck(); }
    });
  }

  guardar(): void {
    if (!this.perfil) return;
    const nombreValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]*$/;
    if (!nombreValido.test(this.perfil.nombre || '') || !nombreValido.test(this.perfil.apellido || '')) {
      this.errorMessage = 'Nombre y apellido solo pueden contener letras.';
      return;
    }
    this.mensaje = '';
    this.errorMessage = '';
    this.perfilService.actualizar(this.perfil).subscribe({
      next: (perfil) => { this.perfil = perfil; this.mensaje = 'Perfil actualizado correctamente.'; this.cdr.markForCheck(); },
      error: (error) => { this.errorMessage = error?.error?.message || 'No fue posible actualizar el perfil.'; this.cdr.markForCheck(); }
    });
  }
}