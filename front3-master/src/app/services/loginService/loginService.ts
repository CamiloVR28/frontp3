// src\app\services\loginService\loginService.ts // Ruta del archivo dentro del proyecto
import { Injectable } from '@angular/core'; // Permite que el servicio sea inyectable en Angular
import { HttpClient } from '@angular/common/http'; // Permite hacer peticiones HTTP
import { tap } from 'rxjs/operators'; // Operador para ejecutar efectos secundarios en observables

@Injectable({
  providedIn: 'root' // Hace el servicio disponible en toda la aplicación
})
export class LoginService {

  private API_URL = 'http://localhost:5000/users'; // URL base del backend para usuarios

  private TOKEN_KEY = 'my_token_key'; // Clave para guardar el token en localStorage
  private USER_KEY = 'userName'; // Clave para guardar el nombre del usuario

  constructor(private http: HttpClient) {} // Inyecta HttpClient para peticiones

  login(email: string, password: string) { // Método para iniciar sesión
  return this.http.post<any>(`${this.API_URL}/login`, { // Petición POST al endpoint de login
    email, // Envía el email
    password // Envía la contraseña
  }).pipe(
    tap((res) => { // Ejecuta lógica adicional sin modificar la respuesta
      const token = res?.data?.access_token; // Extrae el token del backend
      const user = res?.data?.user; // Extrae datos del usuario

      if (token) { // Si existe token
        localStorage.setItem(this.TOKEN_KEY, token); // Guarda el token en localStorage
      }

      if (user) { // Si existe usuario
        localStorage.setItem(this.USER_KEY, user.nombre); // Guarda el nombre del usuario
      }
    })
  );
}

  register(data: any) { // Método para registrar un nuevo usuario
    return this.http.post(`${this.API_URL}/createUser`, data); // Envía datos al endpoint de registro
  }

  getToken(): string | null { // Obtiene el token almacenado
    return localStorage.getItem(this.TOKEN_KEY); // Retorna el token o null
  }

  getUser(): string | null { // Obtiene el nombre del usuario
    return localStorage.getItem(this.USER_KEY); // Retorna el nombre o null
  }

  logout() { // Cierra la sesión del usuario
    localStorage.removeItem(this.TOKEN_KEY); // Elimina el token
    localStorage.removeItem(this.USER_KEY); // Elimina el nombre del usuario
  }

  isLoggedIn(): boolean { // Verifica si el usuario está autenticado
    return !!this.getToken(); // Retorna true si hay token, false si no
  }
}