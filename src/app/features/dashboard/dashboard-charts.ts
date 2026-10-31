import type { ChartComponentLike } from 'chart.js';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

/**
 * Componentes de Chart.js estrictamente necesarios para el dashboard.
 *
 * Se registran de forma explícita para evitar incluir todos los controladores
 * de la librería en el bundle inicial.
 */
export const DASHBOARD_CHART_COMPONENTS: readonly ChartComponentLike[] = [
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
];
