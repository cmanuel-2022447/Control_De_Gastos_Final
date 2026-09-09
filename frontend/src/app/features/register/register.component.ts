import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StrictInputDirective } from '../../shared/strict-input.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StrictInputDirective],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  nombre = '';
  apellido = '';
  usuario = '';
  email = '';
  genero = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  cargando = false;
  mostrarPassword = false;
  mostrarConfirmPassword = false;
  traditionalEnabled = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onRegister(): void {
    if (this.cargando) return;

    this.errorMessage = '';

    if (!this.nombre || !this.apellido || !this.usuario || !this.email || !this.genero || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Todos los campos son obligatorios';
      this.cdr.markForCheck();
      return;
    }

    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]{1,100}$/.test(this.nombre) || !/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]{1,100}$/.test(this.apellido)) {
      this.errorMessage = 'Nombre y apellido solo pueden contener letras.';
      this.cdr.markForCheck();
      return;
    }

    if (!/^[A-Za-z0-9._-]{1,80}$/.test(this.usuario) || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(this.email)) {
      this.errorMessage = 'Revisa el usuario y el formato del correo electrónico.';
      this.cdr.markForCheck();
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      this.cdr.markForCheck();
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'La contraseña debe tener al menos 8 caracteres';
      this.cdr.markForCheck();
      return;
    }

    this.cargando = true;
    this.cdr.markForCheck();
    this.authService.register({ usuario: this.usuario, correo: this.email, password: this.password, nombre: this.nombre, apellido: this.apellido, genero: this.genero }).subscribe({
      next: () => {
        this.cargando = false;
        this.limpiarFormulario();
        this.cdr.markForCheck();
        this.router.navigate(['/login'], {
          state: { registroExitoso: '¡Cuenta creada correctamente! Ahora puedes iniciar sesión.' }
        });
      },
      error: (error) => {
        this.cargando = false;
        this.errorMessage = error?.error?.message || 'No fue posible crear la cuenta.';
        this.cdr.markForCheck();
      }
    });
  }

  private limpiarFormulario(): void {
    this.nombre = '';
    this.apellido = '';
    this.usuario = '';
    this.email = '';
    this.genero = '';
    this.password = '';
    this.confirmPassword = '';
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  alternarConfirmPassword(): void {
    this.mostrarConfirmPassword = !this.mostrarConfirmPassword;
  }
}