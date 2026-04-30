import { Component, OnInit } from '@angular/core'; // Importa decorador y ciclo de vida
import { CommonModule } from '@angular/common'; // Módulo común (ngIf, ngFor, etc.)
import { RouterModule, ActivatedRoute, NavigationEnd, Router } from '@angular/router'; // Manejo de rutas y navegación
import { filter, map } from 'rxjs/operators'; // Operadores para trabajar con observables

@Component({
  selector: 'app-main-layout', // Nombre del componente
  standalone: true, // Componente independiente
  imports: [CommonModule, RouterModule], // Módulos necesarios
  templateUrl: './main-layout.component.html', // HTML asociado
  styleUrls: ['./main-layout.component.scss'] // Estilos asociados
})
export class MainLayoutComponent implements OnInit { // Clase del layout principal

  // 👤 USUARIO (AHORA CORRECTO) // Variable para mostrar usuario
  userEmail: string = 'Usuario'; // Valor por defecto

  showUserMenu: boolean = false; // Controla visibilidad del menú desplegable
  isCollapsed: boolean = false; // Controla estado del sidebar (colapsado o no)
  currentPageTitle: string = 'Dashboard'; // Título dinámico de la página

  constructor(
    private router: Router, // Permite navegación entre rutas
    private route: ActivatedRoute // Permite acceder a la ruta actual
  ) {}

  ngOnInit(): void { // Método que se ejecuta al iniciar el componente

    // 📡 leer email desde localStorage // Obtiene usuario guardado
    const storedEmail = localStorage.getItem('email'); // Lee el email almacenado

    if (storedEmail && storedEmail.trim() !== '') { // Verifica que exista y no esté vacío
      this.userEmail = storedEmail; // Asigna el email al header
    }

    // 🧭 detectar cambio de rutas // Escucha navegación entre páginas
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd), // Filtra solo eventos de navegación finalizada
      map(() => {

        let current = this.route.firstChild; // Obtiene la ruta hija actual

        while (current?.firstChild) { // Recorre hasta la ruta más profunda
          current = current.firstChild;
        }

        return current?.snapshot.data?.['title'] || 'Dashboard'; // Obtiene título desde data de la ruta
      })
    ).subscribe(title => {
      this.currentPageTitle = title; // Actualiza el título en el header
    });
  }

  // 📱 UI // Métodos de interacción de la interfaz
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed; // Alterna estado del sidebar
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu; // Muestra/oculta menú de usuario
  }

  // 🚪 LOGOUT // Cerrar sesión
  logout(): void {
    localStorage.clear(); // Borra todos los datos almacenados
    this.router.navigate(['/login']); // Redirige al login
  }
}