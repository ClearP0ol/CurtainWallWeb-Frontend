<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="振动监测中心" />

      <UDashboardToolbar class="overflow-x-auto">
        <UHorizontalNavigation :links="links" />
      </UDashboardToolbar>

      <NuxtPage />
    </UDashboardPanel>
  </UDashboardPage>
</template>

<script setup lang="ts">
const links = [[
  {
    id: 'dashboard',
    label: '监测总览',
    icon: 'i-heroicons-chart-bar',
    to: '/vibration/dashboard'
  },
  {
    id: 'realtime',
    label: '实时监测',
    icon: 'i-heroicons-signal',
    to: '/vibration',
    exact: true
  },
  {
    id: 'parameter',
    label: '预警规则',
    icon: 'i-heroicons-adjustments-horizontal',
    to: '/vibration/parameter'
  },
  {
    id: 'abnormal',
    label: '预警记录',
    icon: 'i-heroicons-exclamation-triangle',
    to: '/vibration/abnormal'
  }
]]
</script>
