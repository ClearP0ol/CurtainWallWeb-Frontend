import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DataSetsView from '../views/DataSetsView.vue'
import AnalysisJobView from '../views/AnalysisJobView.vue'
import AnalysisModelsView from '../views/AnalysisModelsView.vue'
import VisualizationHeatMapView from '../views/VisualizationHeatMapView.vue'
import VisualizationSliceView from '../views/VisualizationSliceView.vue'
import VisualizationRadarView from '../views/VisualizationRadarView.vue'
import VisualizationClusterView from '@/views/VisualizationClusterView.vue'
import ReportsGenerateView from '../views/ReportsGenerateView.vue'
import ReportsHistoryView from '../views/ReportsHistoryView.vue'
import SystemLogsView from '../views/SystemLogsView.vue'
import SystemStatusView from '../views/SystemStatusView.vue'
import AlertListView from '@/views/AlertListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/datasets',
      name: 'datasets',
      component: DataSetsView,
    },
    {
      path: '/analysis/jobs',
      name: 'analysis-jobs',
      component: AnalysisJobView,
    },
    {
      path: '/analysis/models',
      name: 'analysis-models',
      component: AnalysisModelsView,
    },
    {
      path: '/visualization/heatmap',
      name: 'visualization-heatmap',
      component: VisualizationHeatMapView,
    },
    {
      path: '/visualization/slice',
      name: 'visualization-slice',
      component: VisualizationSliceView,
    },
    {
      path: '/visualization/radar',
      name: 'visualization-radar',
      component: VisualizationRadarView,
    },
    {
      path: '/visualization/cluster',
      name: 'visualization-cluster',
      component: VisualizationClusterView,
    },
    {
      path: '/reports/generate',
      name: 'reports-generate',
      component: ReportsGenerateView,
    },
    {
      path: '/reports/history',
      name: 'reports-history',
      component: ReportsHistoryView,
    },
    {
      path: '/system/logs',
      name: 'system-logs',
      component: SystemLogsView,
    },
    {
      path: '/system/status',
      name: 'system-status',
      component: SystemStatusView,
    },
    {
      path: '/alerts',
      name: 'alert-list',
      component: AlertListView,
    }
  ],
})

export default router
