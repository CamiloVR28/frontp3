// src\app\app.routes.ts // Ruta del archivo dentro del proyecto
import { Routes } from '@angular/router'; // Importa el tipo Routes para definir las rutas de la app
import { Login } from './features/login/login'; // Componente de inicio de sesión
import { MainLayoutComponent } from './features/layout/main-layout.component'; // Componente principal que contiene la estructura (layout)
import { Home } from './features/home/home'; // Componente de la página principal
import { Dashboard } from './features/dashboard/dashboard'; // Componente del dashboard
import { MonitoreoComponent } from './features/monitoreo/monitoreo.component'; // Componente de monitoreo
import { AuthGuard } from './features/guards/auth.guard'; // Guardia que protege rutas (requiere autenticación)

export const routes: Routes = [ // Arreglo que define todas las rutas de la aplicación

  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Redirige la ruta raíz ('') hacia /login
  { path: 'login', component: Login }, // Ruta para mostrar el componente de login
  

  {
    path: '', // Ruta base protegida
    component: MainLayoutComponent, // Usa el layout principal para las rutas hijas
    canActivate: [AuthGuard], // Protege esta ruta con el guard (solo usuarios autenticados)
    children: [ // Rutas hijas que se renderizan dentro del layout
      { path: 'home', component: Home, data: { title: 'Home' } }, // Ruta /home con título
      { path: 'dashboard', component: Dashboard, data: { title: 'Dashboard' } }, // Ruta /dashboard con título
      { path: 'monitoreo', component: MonitoreoComponent, data: { title: 'Monitoreo' } } // Ruta /monitoreo con título
    ]
  },

  { path: '**', redirectTo: 'login' } // Ruta comodín: cualquier ruta no válida redirige a login
];