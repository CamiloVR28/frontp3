import { Component, signal } from '@angular/core'; // Importa el decorador Component y la función signal (estado reactivo)
import { RouterOutlet } from '@angular/router'; // Permite renderizar rutas dentro del componente

@Component({
  selector: 'app-root', // Nombre de la etiqueta HTML que representa este componente
  imports: [RouterOutlet], // Importa RouterOutlet para usar rutas dentro del template
  templateUrl: './app.html', // Archivo HTML asociado a este componente
  styleUrl: './app.scss' // Archivo de estilos asociado al componente
})
export class App { // Define el componente principal de la aplicación
  protected readonly title = signal('frontend-test'); // Variable reactiva que almacena el título de la app
}
