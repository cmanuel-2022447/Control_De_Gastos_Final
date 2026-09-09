import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * INTERCEPTOR DE AUTENTICACIÓN
 * 
 * Responsabilidades:
 * 1. Agregar token JWT a TODAS las peticiones (si existe)
 * 2. Detectar errores 401/403 del backend
 * 3. Llamar al servicio de autenticación para manejar sesión expirada
 * 
 * IMPORTANTE: El manejo de múltiples 401 está centralizado en AuthService
 * NO duplicar lógica aquí
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const esInicioSesion = req.url.endsWith('/login') || req.url.endsWith('/google') || req.url.endsWith('/google-config') || req.url.endsWith('/register');

  // Agregar Authorization header si tenemos token
  let clonedReq = req;
  if (token && !esInicioSesion) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    tap((event: any) => {
      const renewedToken = event?.headers?.get?.('X-Session-Token');
      if (renewedToken && token && authService.getToken() === token) {
        authService.actualizarToken(renewedToken);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // Detectar si el backend rechazó autenticación
      if (error.status === 401) {
        // Solo procesar 401 si hay token y no es una petición al login
        // (el login puede devolver 401 por credenciales incorrectas)
        if (token && authService.getToken() === token && !esInicioSesion && !req.url.endsWith('/logout')) {
          // Notificar al servicio de autenticación
          // La deduplicación se maneja en AuthService
          authService.sesionRechazadaPorBackend();
        }
      }

      // IMPORTANTE: Re-lanzar el error
      // NO ocultarlo con un .of([])
      // Las peticiones deben fallar correctamente cuando el token expire
      // Esto permite que los componentes/servicios manejen el error apropiadamente
      return throwError(() => error);
    })
  );
};