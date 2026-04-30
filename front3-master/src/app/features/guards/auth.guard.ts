// si un usuario puede entrar a una pagina o no // Comentario general: explica que este archivo controla el acceso a rutas
import { Injectable } from '@angular/core'; // Importa Injectable para registrar la clase como servicio
import { CanActivate, Router, UrlTree } from '@angular/router'; // Importa interfaces y clases para proteger rutas y redirigir
import { LoginService } from '../../services/loginService/loginService'; // Servicio que maneja la autenticación del usuario

@Injectable({
  providedIn: 'root' // Hace que el servicio esté disponible globalmente en toda la aplicación
})
export class AuthGuard implements CanActivate { // Implementa CanActivate para decidir si una ruta se puede activar

  constructor(
    private loginService: LoginService, // Inyecta el servicio de login para verificar autenticación
    private router: Router // Inyecta el router para poder redirigir
  ) {}

  canActivate(): boolean | UrlTree { // Método que se ejecuta antes de entrar a una ruta protegida
    const isLogged = this.loginService.isLoggedIn(); // Verifica si el usuario está autenticado (por ejemplo, con token)

    if (!isLogged) { // Si no está autenticado
      return this.router.createUrlTree(['/login']); // Bloquea acceso y redirige al login
    }

    return true; // Si está autenticado, permite el acceso a la ruta
  }
}