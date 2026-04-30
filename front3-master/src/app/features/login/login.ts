import { Component } from '@angular/core'; // Decorador para definir el componente
import { Router } from '@angular/router'; // Permite navegar entre rutas
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // Manejo de formularios reactivos y validaciones
import { CommonModule } from '@angular/common'; // Módulo común de Angular
import { LoginService } from '../../services/loginService/loginService'; // Servicio de autenticación

@Component({
  selector: 'app-login', // Nombre del componente
  standalone: true, // Componente independiente
  imports: [ReactiveFormsModule, CommonModule], // Módulos necesarios
  templateUrl: './login.html', // HTML asociado
  styleUrl: './login.scss' // Estilos asociados
})
export class Login { // Clase del componente Login

  hidePassword = true; // Controla si la contraseña está oculta o visible
  errorMsg = ''; // Mensaje de error para mostrar en pantalla

  form: any; // Formulario reactivo

  constructor(
    private fb: FormBuilder, // Construye el formulario
    private loginService: LoginService, // Servicio para login
    private router: Router // Navegación
  ) {
    this.form = this.fb.group({ // Inicializa el formulario
      email: ['', [Validators.required, Validators.email]], // Campo email con validaciones
      password: ['', [Validators.required, Validators.minLength(6)]] // Campo password con validaciones
    });
  }

  get emailCtrl() { // Getter para acceder al control email
    return this.form.get('email'); // Retorna control email
  }

  get passwordCtrl() { // Getter para acceder al control password
    return this.form.get('password'); // Retorna control password
  }

  submit() { // Método que se ejecuta al enviar el formulario
    if (this.form.invalid) { // Si el formulario es inválido
      this.form.markAllAsTouched(); // Marca todos los campos como tocados
      return; // Detiene ejecución
    }

    const { email, password } = this.form.value; // Extrae valores del formulario

    this.loginService.login(email, password).subscribe({ // Llama al servicio de login
      next: (res: any) => { // Respuesta exitosa

        console.log('LOGIN RESPONSE:', res); // Muestra respuesta en consola

        // ✅ TOKEN CORRECTO SEGÚN TU BACKEND // Validación del token
        const token = res?.data?.access_token; // Obtiene token del backend

        if (!token) { // Si no existe token
          console.error('❌ No se encontró token'); // Error en consola
          this.errorMsg = 'Error en autenticación'; // Muestra mensaje
          return; // Detiene ejecución
        }

        // 🔥 GUARDAR TOKEN // Persistencia de sesión
        localStorage.setItem('token', token); // Guarda token en localStorage

        console.log('✅ TOKEN GUARDADO'); // Confirmación en consola

        // 🚀 REDIRECCIÓN // Navegación después del login
        this.router.navigateByUrl('/home'); // Redirige al home
      },
      error: () => { // Si ocurre error en login
        this.errorMsg = 'Correo o contraseña incorrectos'; // Mensaje de error
      }
    });
  }

  togglePasswordVisibility() { // Mostrar/ocultar contraseña
    this.hidePassword = !this.hidePassword; // Alterna estado
  }

  goToRegister() { // Navegar a registro
    this.router.navigateByUrl('/register'); // Redirige a /register
  }
}