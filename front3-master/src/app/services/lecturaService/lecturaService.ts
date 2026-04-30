import { Injectable } from '@angular/core'; // Permite que el servicio pueda inyectarse en toda la app
import { HttpClient } from '@angular/common/http'; // Permite hacer peticiones HTTP al backend
import { BehaviorSubject, Observable, map } from 'rxjs'; // Herramientas de programación reactiva

export interface Lectura { // Define la estructura de una lectura de sensor
  id: number; // ID único de la lectura
  sensor_id: number; // ID del sensor (1 temp, 2 humedad, 3 suelo)
  valor: number; // Valor principal de la lectura
  valor_adc: number | null; // Valor analógico opcional
  timestamp: string; // Fecha y hora de la lectura
  led_state: any; // Estado del LED (puede variar en tipo)
}

export interface NormalizedLecturas { // Agrupa lecturas por tipo de sensor
  temperature: Lectura[]; // Lecturas de temperatura
  humidity: Lectura[]; // Lecturas de humedad ambiente
  soil: Lectura[]; // Lecturas de humedad del suelo
}

export interface Summary { // Estructura para KPIs (valores máximos y mínimos)
  tempMax: number; // Temperatura máxima
  tempMin: number; // Temperatura mínima
  humAmbMax: number; // Humedad ambiente máxima
  humAmbMin: number; // Humedad ambiente mínima
  humSueloMax: number; // Humedad suelo máxima
  humSueloMin: number; // Humedad suelo mínima
}

export interface ChartDataFormat { // Formato de datos para gráficas
  labels: string[]; // Etiquetas (tiempo)
  data: number[]; // Valores numéricos
}

@Injectable({
  providedIn: 'root' // Hace el servicio disponible globalmente
})
export class LecturasService {

  // 🔥 Usando endpoint de prueba // Indica que se está usando una API local para pruebas
  private API_URL = 'http://localhost:5000/sensores/ultimo-free'; // URL del backend

  private lecturasSubject = new BehaviorSubject<Lectura[]>([]); // Almacena el estado actual de lecturas
  lecturas$ = this.lecturasSubject.asObservable(); // Observable para suscribirse a cambios

  constructor(private http: HttpClient) {} // Inyecta HttpClient para hacer requests

  // 🔥 FETCH // Método para obtener datos del backend
  fetchLecturas(): Observable<Lectura[]> {
    console.log('[SERVICE] Fetching lecturas...'); // Log de depuración

    const token = localStorage.getItem('token'); // Obtiene el token almacenado

    return this.http.get<any>(this.API_URL, { // Realiza petición GET
      headers: {
        Authorization: `Bearer ${token}` // Envía el token en headers
      }
    }).pipe(
      map(res => { // Transforma la respuesta

        // 🔥 Soporta array, {data:[]}, o un solo objeto // Maneja diferentes formatos de respuesta
        const data: Lectura[] = Array.isArray(res)
          ? res
          : res?.data
          ? res.data
          : [res];

        console.log('[FETCH] total lecturas received:', data.length); // Log cantidad de datos
        console.log('[FETCH SAMPLE]', data[0]); // Log ejemplo de lectura

        this.lecturasSubject.next(data); // Actualiza el estado interno

        return data; // Retorna datos procesados
      })
    );
  }

  // 🔄 STREAM // Flujo reactivo de datos normalizados
  normalized$: Observable<NormalizedLecturas> = this.lecturas$.pipe(
    map((lecturas: Lectura[]) => {
      console.log('[STREAM] lecturas$ emitted:', lecturas.length); // Log del stream
      return this.normalizeLecturas(lecturas); // Normaliza datos
    })
  );

  // 🔥 NORMALIZACIÓN (AQUÍ ESTÁ EL FIX) // Convierte datos a formato uniforme
  private normalizeLecturas(lecturas: Lectura[]): NormalizedLecturas {

    console.log('[NORMALIZE] input size:', lecturas.length); // Log tamaño entrada

    const grouped: NormalizedLecturas = {
      temperature: [], // Inicializa array de temperatura
      humidity: [], // Inicializa array de humedad
      soil: [] // Inicializa array de suelo
    };

    lecturas.forEach((l: any) => { // Itera cada lectura

      // 🔥 CASO 1: DATOS DE PRUEBA (/ultimo-free) // Cuando vienen del endpoint de prueba
      // -----------------------------------------
      // El backend manda:
      // temperatura, humedad_ambiente, humedad_suelo // Campos específicos del backend

      if (l.temperatura !== undefined) { // Detecta formato de prueba

        grouped.temperature.push({
          ...l,
          sensor_id: 1, // Asigna ID de sensor temperatura
          valor: Number(l.temperatura), // Convierte a número
          timestamp: l.created_at // Usa fecha de creación
        });

        grouped.humidity.push({
          ...l,
          sensor_id: 2, // ID humedad
          valor: Number(l.humedad_ambiente), // Convierte valor
          timestamp: l.created_at
        });

        grouped.soil.push({
          ...l,
          sensor_id: 3, // ID suelo
          valor: Number(l.humedad_suelo), // Convierte valor
          timestamp: l.created_at
        });

      } else {

        // 🔥 CASO 2: DATOS REALES (ESP32 / historial) // Datos reales desde sensores
        const sensorId = Number(l.sensor_id); // Convierte ID a número

        const parsed: Lectura = {
          ...l,
          sensor_id: sensorId, // Normaliza ID
          valor: Number(l.valor) || 0, // Asegura valor numérico
          timestamp: l.timestamp // Mantiene timestamp
        };

        if (sensorId === 1) grouped.temperature.push(parsed); // Clasifica temperatura
        if (sensorId === 2) grouped.humidity.push(parsed); // Clasifica humedad
        if (sensorId === 3) grouped.soil.push(parsed); // Clasifica suelo
      }
    });

    console.log('[GROUPED]', { // Log resumen de agrupación
      temp: grouped.temperature.length,
      hum: grouped.humidity.length,
      soil: grouped.soil.length
    });

    Object.keys(grouped).forEach(key => { // Ordena cada grupo por tiempo
      grouped[key as keyof NormalizedLecturas].sort(
        (a: Lectura, b: Lectura) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      );
    });

    console.log('[NORMALIZE DONE]'); // Fin de normalización

    return grouped; // Retorna datos organizados
  }

  // 📊 KPIs // Flujo para calcular métricas
  summary$: Observable<Summary> = this.normalized$.pipe(
    map((data: NormalizedLecturas) => {
      const summary = this.buildSummary(data); // Construye resumen
      console.log('[SUMMARY STREAM]', summary); // Log del resultado
      return summary;
    })
  );

  private buildSummary(data: NormalizedLecturas): Summary { // Calcula máximos y mínimos

    const getStats = (arr: Lectura[], label: string) => { // Función auxiliar
      if (!arr.length) {
        console.warn(`[SUMMARY] ${label} empty`); // Aviso si no hay datos
        return { max: 0, min: 0 };
      }

      const values = arr.map(l => l.valor); // Extrae valores

      return {
        max: Math.max(...values), // Máximo
        min: Math.min(...values) // Mínimo
      };
    };

    const temp = getStats(data.temperature, 'TEMP'); // Stats temperatura
    const hum = getStats(data.humidity, 'HUM'); // Stats humedad
    const soil = getStats(data.soil, 'SOIL'); // Stats suelo

    return {
      tempMax: temp.max,
      tempMin: temp.min,
      humAmbMax: hum.max,
      humAmbMin: hum.min,
      humSueloMax: soil.max,
      humSueloMin: soil.min
    };
  }

  // 📈 GRÁFICA // Datos para gráfica de temperatura
  tempLast5Min$: Observable<ChartDataFormat> = this.normalized$.pipe(
    map((data: NormalizedLecturas) => {

      const last20 = data.temperature.slice(-20); // Toma últimos 20 registros

      const labels = last20.map(l =>
        new Date(l.timestamp).toLocaleTimeString() // Convierte a hora legible
      );

      const values = last20.map(l => l.valor); // Extrae valores

      return {
        labels,
        data: values
      };
    })
  );

  // 📡 ÚLTIMO ESTADO // Última lectura disponible
  latest$: Observable<any> = this.lecturas$.pipe(
    map((lecturas: Lectura[]) => {

      if (!lecturas || lecturas.length === 0) return null; // Si no hay datos

      const sorted = [...lecturas].sort( // Ordena por fecha
        (a, b) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      );

      const last = sorted.at(-1); // Obtiene última lectura
      if (!last) return null;

      const snapshot = {
        temp: null as number | null, // Última temperatura
        hum: null as number | null, // Última humedad
        soil: null as number | null, // Última humedad suelo
        led: last.led_state ?? null, // Estado del LED
        timestamp: last.timestamp ?? null // Timestamp
      };

      for (let i = sorted.length - 1; i >= 0; i--) { // Recorre hacia atrás
        const l = sorted[i];

        if (snapshot.temp === null && l.sensor_id === 1) snapshot.temp = l.valor; // Encuentra última temp
        if (snapshot.hum === null && l.sensor_id === 2) snapshot.hum = l.valor; // Última humedad
        if (snapshot.soil === null && l.sensor_id === 3) snapshot.soil = l.valor; // Último suelo

        if (
          snapshot.temp !== null &&
          snapshot.hum !== null &&
          snapshot.soil !== null
        ) break; // Termina cuando ya tiene todos
      }

      return snapshot; // Retorna estado final
    })
  );

}