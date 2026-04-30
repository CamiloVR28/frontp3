import { TestBed } from '@angular/core/testing'; // Herramienta para configurar y ejecutar pruebas en Angular
import { App } from './app'; // Importa el componente principal de la aplicación

describe('App', () => { // Define un bloque de pruebas para el componente App
  beforeEach(async () => { // Se ejecuta antes de cada prueba
    await TestBed.configureTestingModule({ // Configura el entorno de pruebas
      imports: [App], // Importa el componente que se va a probar
    }).compileComponents(); // Compila los componentes antes de ejecutar las pruebas
  });

  it('should create the app', () => { // Prueba que verifica si la app se crea correctamente
    const fixture = TestBed.createComponent(App); // Crea una instancia del componente
    const app = fixture.componentInstance; // Obtiene la instancia del componente
    expect(app).toBeTruthy(); // Verifica que la instancia exista (no sea null o undefined)
  });

  it('should render title', async () => { // Prueba que verifica si se renderiza el título en el HTML
    const fixture = TestBed.createComponent(App); // Crea una instancia del componente
    await fixture.whenStable(); // Espera a que se estabilicen los cambios asincrónicos
    const compiled = fixture.nativeElement as HTMLElement; // Obtiene el HTML renderizado
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, frontend-test'); // Verifica que el h1 contenga ese texto
  });
});
