import { Component } from '@angular/core'; // Importa el decorador para crear componentes
import { Router } from '@angular/router'; // Permite navegar entre páginas
import { CommonModule } from '@angular/common'; // Módulo común (ngIf, ngFor, etc.)

@Component({ // Decorador que define el componente
  selector: 'app-home', // Nombre de la etiqueta HTML para usar este componente
  standalone: true, // Indica que es un componente independiente
  imports: [CommonModule], // Importa funcionalidades básicas de Angular
  templateUrl: './home.html', // Archivo HTML asociado
  styleUrl: './home.scss' // Archivo de estilos asociado
})
export class Home { // Clase del componente Home

  constructor(private router: Router) {} // Inyecta el router para navegación

  goToDashboard(): void { // Método para ir al dashboard
    this.router.navigateByUrl('/dashboard'); // Navega a la ruta /dashboard
  }

  goToMonitoreo(): void { // Método para ir a monitoreo
    this.router.navigateByUrl('/monitoreo'); // Navega a la ruta /monitoreo
  }
}