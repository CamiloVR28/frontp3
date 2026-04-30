
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'; // Importa tipos y función para manejar errores globales en el navegador
import { provideRouter } from '@angular/router'; // Permite configurar el sistema de rutas en Angular
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // Permite hacer peticiones HTTP y usar interceptores
import { routes } from './app.routes'; // Importa las rutas definidas de la aplicación
import { authInterceptor } from './HTTP/auth.interceptor'; // Importa el interceptor para manejar autenticación en las peticiones

export const appConfig: ApplicationConfig = { // Define la configuración global de la aplicación
  providers: [ // Lista de servicios/configuraciones disponibles en toda la app
    provideBrowserGlobalErrorListeners(), // Activa manejo global de errores en el navegador
    provideRouter(routes), // Configura el enrutamiento usando las rutas definidas
    provideHttpClient(withInterceptors([authInterceptor])) // Configura cliente HTTP con interceptor de autenticación
  ]
};
