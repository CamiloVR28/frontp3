import { HttpInterceptorFn } from '@angular/common/http'; // Importa el tipo para crear un interceptor HTTP funcional

export const authInterceptor: HttpInterceptorFn = (req, next) => { // Define el interceptor que intercepta cada petición HTTP

  // 🔥 MISMA KEY QUE EN LOGIN // Indica que la clave 'token' debe coincidir con la usada al iniciar sesión
  const token = localStorage.getItem('token'); // Obtiene el token almacenado en el navegador (localStorage)

  if (!token) { // Si no existe token
    return next(req); // Envía la petición original sin modificar
  }

  const authReq = req.clone({ // Clona la petición original para no modificarla directamente
    setHeaders: { // Agrega cabeceras HTTP
      Authorization: `Bearer ${token}` // Añade el token en el header Authorization con formato Bearer
    }
  });

  return next(authReq); // Envía la petición modificada con el token incluido
};