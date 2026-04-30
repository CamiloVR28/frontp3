// 📊 IMPORTACIONES ANGULAR // Sección de importaciones principales
import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core'; // Importa decorador, ciclo de vida, acceso a vista y detección de cambios
import { CommonModule } from '@angular/common'; // Módulo común de Angular (ngIf, ngFor, etc.)
import { BaseChartDirective } from 'ng2-charts'; // Directiva para trabajar con gráficos en Angular
import { ChartConfiguration, ChartData, ChartType } from 'chart.js'; // Tipos para configuración de gráficos
import { interval } from 'rxjs'; // Permite ejecutar tareas periódicas

import { LecturasService, Summary, ChartDataFormat } from '../../services/lecturaService/lecturaService'; // Servicio de datos y modelos

@Component({
  selector: 'app-dashboard', // Nombre del componente
  standalone: true, // Indica que es un componente independiente
  imports: [CommonModule, BaseChartDirective], // Importa módulos necesarios
  templateUrl: './dashboard.html', // HTML asociado
  styleUrls: ['./dashboard.scss'] // Estilos asociados
})
export class Dashboard implements OnInit { // Clase principal del componente

  // 📌 REFERENCIA AL GRÁFICO // Acceso directo al gráfico en el DOM
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective; // Permite manipular el gráfico

  // 📊 KPIs // Variables para mostrar métricas
  summary: Summary = {
    tempMax: 0, // Temperatura máxima inicial
    tempMin: 0, // Temperatura mínima inicial
    humAmbMax: 0, // Humedad máxima
    humAmbMin: 0, // Humedad mínima
    humSueloMax: 0, // Humedad suelo máxima
    humSueloMin: 0 // Humedad suelo mínima
  };

  // 📈 TIPO DE GRÁFICO // Define tipo de gráfica
  lineChartType: ChartType = 'line'; // Gráfica de tipo línea

  // 📊 DATOS DEL GRÁFICO // Estructura de datos para la gráfica
  lineChartData: ChartData<'line'> = {
    labels: [], // Etiquetas (tiempo)
    datasets: [
      {
        data: [], // Valores de temperatura
        label: 'Temperatura (°C)', // Nombre del dataset
        borderColor: '#4CAF50', // Color de la línea
        backgroundColor: 'rgba(76, 175, 80, 0.15)', // Color de fondo
        pointBackgroundColor: '#A5D6A7', // Color de puntos
        pointBorderColor: '#ffffff', // Borde de puntos
        tension: 0.4, // Suaviza la curva
        borderWidth: 2.5, // Grosor de la línea
        pointRadius: 3, // Tamaño del punto
        pointHoverRadius: 6, // Tamaño al pasar el mouse
        pointHitRadius: 12, // Área de interacción
        fill: true // Rellena el área bajo la línea
      }
    ]
  };

  // ⚙️ CONFIGURACIÓN // Opciones del gráfico
  chartOptions: ChartConfiguration['options'] = {
    responsive: true, // Se adapta al tamaño del contenedor
    maintainAspectRatio: false, // Permite ajustar altura libremente

    plugins: {
      legend: {
        labels: {
          color: '#E8F5E9', // Color del texto
          font: { size: 13, weight: 500 } // Tamaño y grosor
        }
      },
      tooltip: {
        backgroundColor: '#1B2A25', // Fondo tooltip
        titleColor: '#A5D6A7', // Color título
        bodyColor: '#E8F5E9', // Color contenido
        borderColor: '#4CAF50', // Borde
        borderWidth: 1, // Grosor borde
        displayColors: false // Oculta indicadores de color
      }
    },

    scales: {
      x: {
        ticks: { color: '#C8E6C9' }, // Color etiquetas eje X
        grid: { color: 'rgba(255,255,255,0.05)' } // Líneas de fondo
      },
      y: {
        ticks: { color: '#C8E6C9' }, // Color etiquetas eje Y
        grid: { color: 'rgba(255,255,255,0.08)' } // Líneas de fondo
      }
    },

    animation: {
      duration: 800, // Duración de animación
      easing: 'easeInOutQuart' // Tipo de animación
    }
  };

  constructor(
    private lecturasService: LecturasService, // Servicio que obtiene datos
    private cdr: ChangeDetectorRef // Permite forzar actualización de vista
  ) {}

  // 🚀 INICIO // Método que se ejecuta al cargar el componente
  ngOnInit() {

    // 🔥 PRIMER FETCH (inmediato) // Obtiene datos iniciales
    this.lecturasService.fetchLecturas().subscribe({
      next: (data) => console.log('[INIT FETCH]', data.length), // Log éxito
      error: (err) => console.error('[INIT ERROR]', err) // Log error
    });

    // 🔁 AUTO-REFRESH CADA 3 SEGUNDOS // Actualiza datos automáticamente
    interval(3000).subscribe(() => {
      this.lecturasService.fetchLecturas().subscribe({
        next: (data) => console.log('[AUTO REFRESH]', data.length), // Log actualización
        error: (err) => console.error('[REFRESH ERROR]', err) // Log error
      });
    });

    // 📊 KPIs // Suscripción a métricas
    this.lecturasService.summary$.subscribe((summary: Summary) => {
      this.summary = summary; // Actualiza KPIs
      this.cdr.detectChanges(); // Fuerza actualización de vista
    });

    // 📈 GRÁFICA // Suscripción a datos de temperatura
    this.lecturasService.tempLast5Min$.subscribe((temp: ChartDataFormat) => {

      if (!temp || !temp.data.length) { // Si no hay datos
        this.lineChartData.labels = []; // Limpia etiquetas
        this.lineChartData.datasets[0].data = []; // Limpia valores
      } else {
        this.lineChartData.labels = [...temp.labels]; // Actualiza etiquetas
        this.lineChartData.datasets[0].data = [...temp.data]; // Actualiza valores
      }

      setTimeout(() => { // Espera renderizado
        this.chart?.update(); // Actualiza gráfica
        this.applyGradient(); // Aplica degradado
      }, 0);

      this.cdr.detectChanges(); // Actualiza vista
    });
  }

  // 🌈 GRADIENTE // Aplica efecto visual al gráfico
  private applyGradient() {
    const chartInstance = this.chart?.chart; // Obtiene instancia del gráfico
    if (!chartInstance) return; // Sale si no existe

    const ctx = chartInstance.ctx; // Contexto de canvas
    const chartArea = chartInstance.chartArea; // Área del gráfico
    if (!chartArea) return; // Sale si no está listo

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom); // Crea degradado vertical
    gradient.addColorStop(0, 'rgba(76, 175, 80, 0.35)'); // Color superior
    gradient.addColorStop(1, 'rgba(76, 175, 80, 0.02)'); // Color inferior

    chartInstance.data.datasets[0].backgroundColor = gradient; // Aplica degradado al fondo
  }
}