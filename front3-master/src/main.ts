import { bootstrapApplication } from '@angular/platform-browser'; // Función para iniciar (bootstrap) la aplicación Angular
import { App } from './app/app'; // Importa el componente raíz de la aplicación
import { appConfig } from './app/app.config'; // Importa la configuración global de la app

import { provideCharts, withDefaultRegisterables } from 'ng2-charts'; // Importa configuración para usar gráficos con Chart.js en Angular

bootstrapApplication(App, { // Inicia la aplicación usando el componente raíz App
  ...appConfig, // Expande (incluye) toda la configuración definida en appConfig
  providers: [ // Define proveedores globales (servicios o configuraciones)
    ...(appConfig.providers || []), // Mantiene los providers existentes en appConfig (si hay)
    provideCharts(withDefaultRegisterables()) // Habilita gráficos registrando componentes por defecto de Chart.js
  ]
}).catch(err => console.error(err)); // Captura y muestra errores si falla el arranque de la app