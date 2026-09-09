import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppShellComponent } from '../../shared/app-shell/app-shell.component';

@Component({
  selector: 'app-ayuda',
  standalone: true,
  imports: [CommonModule, AppShellComponent],
  templateUrl: './ayuda.html',
  styleUrl: './ayuda.css'
})
export class AyudaComponent {}