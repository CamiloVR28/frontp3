/*
========================================================
📡 COMPONENTE: MONITOREO IoT (Angular)
========================================================
Este componente:
- Consume datos de sensores (ESP32)
- Normaliza información
- Muestra KPIs (temp, humedad, suelo)
- Controla LEDs
- Genera gráfico en tiempo real (Chart.js)
========================================================
*/

import {
  Component, // Decorador para definir componente
  OnInit, // Hook de inicialización
  OnDestroy, // Hook de destrucción (limpieza)
  AfterViewInit, // Se ejecuta después de cargar el HTML
  ChangeDetectorRef // Permite forzar actualización de la vista
} from '@angular/core';

import { CommonModule } from '@angular/common'; // Módulo base Angular

import { Subject, interval, takeUntil, distinctUntilChanged } from 'rxjs'; // RxJS para manejo reactivo

import Chart from 'chart.js/auto'; // Librería de gráficos

import {
  LecturasService, // Servicio que trae datos del backend
  NormalizedLecturas, // Tipo de datos normalizados
  Lectura // Tipo de lectura individual
} from '../../services/lecturaService/lecturaService';

@Component({
  selector: 'app-monitoreo', // Nombre del componente
  standalone: true, // No depende de módulo
  imports: [CommonModule], // Importa funcionalidades básicas
  templateUrl: './monitoreo.component.html', // HTML asociado
  styleUrls: ['./monitoreo.component.scss'] // Estilos
})
export class MonitoreoComponent implements OnInit, AfterViewInit, OnDestroy {

  // ======================================================
  // 📊 VARIABLES DE SENSORES (KPIs)
  // ======================================================

  currentTemp: number | null = null; // Guarda última temperatura
  currentHum: number | null = null;  // Guarda última humedad ambiente
  currentSoil: number | null = null; // Guarda humedad del suelo

  lastUpdate: Date | null = null; // Guarda última actualización

  // ======================================================
  // 💡 ESTADO DE LEDS
  // ======================================================

  ledState: any = null; // Estado crudo recibido del backend
  ledEntries: { key: string; value: string }[] = []; // Formato listo para mostrar en HTML

  // ======================================================
  // 📈 GRÁFICO
  // ======================================================

  unifiedChart: Chart | null = null; // Instancia del gráfico Chart.js

  // ======================================================
  // 🧹 CONTROL DE MEMORIA (RxJS)
  // ======================================================

  private destroy$ = new Subject<void>(); // Se usa para cancelar suscripciones

  private lastNormalizedData: NormalizedLecturas | null = null; // Guarda últimos datos

  private chartReady = false; // Indica si el canvas ya existe

  // ======================================================
  // 🔌 INYECCIÓN DE DEPENDENCIAS
  // ======================================================

  constructor(
    private lecturasService: LecturasService, // Servicio de datos IoT
    private cdr: ChangeDetectorRef // Control manual de UI
  ) {}

  // ======================================================
  // 🚀 INICIO DEL COMPONENTE
  // ======================================================

  ngOnInit() {

    /*
    ⏱️ POLLING:
    Cada 5 segundos pide nuevos datos al backend
    */
    interval(5000) // Ejecuta cada 5 segundos
      .pipe(takeUntil(this.destroy$)) // Se cancela al destruir componente
      .subscribe(() => {
        this.lecturasService.fetchLecturas().subscribe(); // Llama API
      });

    /*
    📡 Primera carga inmediata
    */
    this.lecturasService.fetchLecturas().subscribe(); // Llama API apenas inicia

    /*
    📡 STREAM DE DATOS NORMALIZADOS
    Recibe datos ya organizados desde el servicio
    */
    this.lecturasService.normalized$
      .pipe(
        /*
        🔁 Evita actualizaciones innecesarias si los datos no cambiaron
        */
        distinctUntilChanged((prev, curr) => {
          return prev.temperature.length === curr.temperature.length &&
                 prev.humidity.length === curr.humidity.length &&
                 prev.soil.length === curr.soil.length &&
                 prev.temperature[prev.temperature.length - 1]?.timestamp ===
                 curr.temperature[curr.temperature.length - 1]?.timestamp; // Compara último dato
        }),

        takeUntil(this.destroy$) // Evita memory leaks
      )
      .subscribe(data => {

        // ❌ Validación de seguridad (evita datos vacíos)
        if (!data?.temperature?.length || !data?.humidity?.length || !data?.soil?.length) {
          console.warn('[MONITOREO] Datos incompletos'); // Advertencia
          return;
        }

        // 💾 guarda último estado
        this.lastNormalizedData = data; // Cache

        // 📊 si el gráfico ya está listo, procesa datos
        if (this.chartReady) {
          this.processData(data); // Procesa info
        }
      });
  }

  // ======================================================
  // 🎨 DESPUÉS DE CARGAR LA VISTA (HTML)
  // ======================================================

  ngAfterViewInit() {

    // 📈 inicializa gráfico Chart.js
    this.initChart(); // Crea gráfico

    this.chartReady = true; // Marca como listo

    // 🔁 si llegaron datos antes del chart, los procesa ahora
    if (this.lastNormalizedData) {
      this.processData(this.lastNormalizedData); // Procesa datos guardados
    }
  }

  // ======================================================
  // 📊 INICIALIZAR GRÁFICO
  // ======================================================

  private initChart() {

    const ctx = document.getElementById('unifiedCanvas') as HTMLCanvasElement; // Obtiene canvas

    this.unifiedChart = new Chart(ctx, {
      type: 'line', // Tipo de gráfico

      data: {
        labels: [], // Eje X (tiempo)

        datasets: [
          {
            label: 'Temperatura °C', // Dataset temperatura
            data: [],
            borderColor: '#4FC3F7',
            backgroundColor: 'rgba(79,195,247,0.2)',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Humedad %', // Dataset humedad
            data: [],
            borderColor: '#81C784',
            backgroundColor: 'rgba(129,199,132,0.2)',
            tension: 0.4,
            yAxisID: 'y1'
          },
          {
            label: 'Suelo', // Dataset suelo
            data: [],
            borderColor: '#FFB74D',
            backgroundColor: 'rgba(255,183,77,0.2)',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },

      options: {
        responsive: true, // Adaptable
        maintainAspectRatio: false // Permite controlar tamaño
      }
    });
  }

  // ======================================================
  // ⚙️ PROCESAR DATOS RECIBIDOS
  // ======================================================

  private processData(data: NormalizedLecturas) {

    // ❌ validación defensiva
    if (!data?.temperature?.length) return; // Si no hay datos, sale

    // ==================================================
    // 📊 KPIs (últimos valores)
    // ==================================================

    const tempArr = data.temperature; // Array temperatura
    const humArr = data.humidity; // Array humedad
    const soilArr = data.soil; // Array suelo

    this.currentTemp = tempArr.at(-1)?.valor ?? 0; // Último valor temp
    this.currentHum = humArr.at(-1)?.valor ?? 0; // Último valor humedad
    this.currentSoil = soilArr.at(-1)?.valor ?? 0; // Último valor suelo

    // ==================================================
    // 💡 LEDS
    // ==================================================

    const allReadings = [...tempArr, ...humArr, ...soilArr]; // Une todos

    const sorted = allReadings.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() // Ordena por fecha desc
    );

    const latest = sorted.find(l => l.led_state != null); // Busca el último con LEDs

    this.ledState = latest?.led_state ?? null; // Guarda estado

    // 🔄 normalización de LEDs para HTML
    this.ledEntries = [];

    if (this.ledState) {

      const ledSource =
        this.ledState.leds && typeof this.ledState.leds === 'object'
          ? this.ledState.leds
          : this.ledState;

      if (typeof ledSource === 'object' && !Array.isArray(ledSource)) {
        this.ledEntries = Object.entries(ledSource).map(([key, value]) => ({
          key,
          value: String(value).toLowerCase() // Convierte a string y minúscula
        }));
      }
    }

    // 🕒 actualizar timestamp
    this.lastUpdate = new Date(); // Guarda hora actual

    // 🔁 forzar actualización UI
    this.cdr.detectChanges(); // Refresca vista

    // ==================================================
    // 📈 GRÁFICO (NORMALIZACIÓN DE TIEMPOS)
    // ==================================================

    const map = new Map<number, any>(); // Mapa por timestamp

    const insert = (arr: Lectura[], key: string) => {
      arr.forEach(l => {
        const t = new Date(l.timestamp).getTime(); // Convierte tiempo

        if (!map.has(t)) map.set(t, {}); // Crea entrada

        map.get(t)[key] = l.valor; // Asigna valor
      });
    };

    insert(tempArr, 'temp'); // Inserta temperatura
    insert(humArr, 'hum'); // Inserta humedad
    insert(soilArr, 'soil'); // Inserta suelo

    const timestamps = Array.from(map.keys()).sort((a, b) => a - b); // Ordena tiempos

    const last = timestamps.slice(-20); // Últimos 20 datos

    const labels = last.map(t => new Date(t).toLocaleTimeString()); // Labels

    const tempData = last.map(t => map.get(t)?.temp ?? null); // Datos temp
    const humData = last.map(t => map.get(t)?.hum ?? null); // Datos hum
    const soilData = last.map(t => map.get(t)?.soil ?? null); // Datos suelo

    //  actualizar gráfico
    if (this.unifiedChart) {
      this.unifiedChart.data.labels = labels;

      this.unifiedChart.data.datasets[0].data = tempData;
      this.unifiedChart.data.datasets[1].data = humData;
      this.unifiedChart.data.datasets[2].data = soilData;

      this.unifiedChart.update(); // Redibuja gráfico
    }
  }

  // ======================================================
  // 🧹 LIMPIEZA (IMPORTANTE)
  // ======================================================

  ngOnDestroy() {

    // 🔥 corta todos los observables activos
    this.destroy$.next(); // Emite cierre
    this.destroy$.complete(); // Completa observable
  }
}