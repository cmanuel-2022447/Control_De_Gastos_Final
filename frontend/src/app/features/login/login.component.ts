import { Component, AfterViewInit, PLATFORM_ID, Inject, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { StrictInputDirective } from '../../shared/strict-input.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StrictInputDirective],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('googleButton') googleButton?: ElementRef<HTMLElement>;
  loginValue: string = '';
  password: string = '';
  error: string = '';
  success = '';
  mostrarPassword = false;
  cargando = false;
  googleEnabled = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.success = window.history.state?.registroExitoso || '';
      this.authService.googleConfig().subscribe(config => {
        this.googleEnabled = config.enabled;
        this.cdr.detectChanges();
        if (config.enabled && config.clientId) {
          setTimeout(() => {
            if (this.googleButton) {
              this.authService.renderGoogleButton(this.googleButton.nativeElement, config.clientId!, credential => this.loginWithGoogle(credential));
            }
          });
        }
      });
      console.log('Componente Login inicializado');
      this.cdr.markForCheck();
    }
  }

  private loginWithGoogle(credential: string): void {
    this.cargando = true;
    this.error = '';
    this.authService.googleLogin(credential).pipe(finalize(() => { this.cargando = false; this.cdr.detectChanges(); })).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.error = err.status === 503
          ? 'El inicio de sesión con Google no está disponible.'
          : err.status === 409
            ? 'La cuenta de Google no coincide con la cuenta existente.'
            : 'No fue posible validar la cuenta de Google.';
      }
    });
  }

  login(): void {
    if (!this.loginValue || !this.password) {
      this.error = 'Por favor completa todos los campos';
      this.cdr.detectChanges();
      return;
    }

    const esCorreo = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(this.loginValue);
    const esUsuario = /^[A-Za-z0-9._-]{1,80}$/.test(this.loginValue);
    if (!esCorreo && !esUsuario) {
      this.error = 'Ingresa un correo válido o un usuario válido.';
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.authService.login({ login: this.loginValue, password: this.password })
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Login exitoso:', response);
          this.cdr.detectChanges();
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Error en login:', err);
          this.error = err.status === 503
            ? 'La base de datos no está disponible.'
            : 'Credenciales inválidas. Intenta de nuevo.';
          this.cdr.detectChanges();
        }
      });
  }

  alternarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
    this.cdr.detectChanges();
  }

}
