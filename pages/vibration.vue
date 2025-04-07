<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="监测中心">
      </UDashboardNavbar>

      <UDashboardToolbar class="overflow-x-auto">
        <UHorizontalNavigation :links="links"/>
      </UDashboardToolbar>

      <NuxtPage/>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<script setup lang="ts">
const links = [[
{
  id: 'parameter',
  label: '参数设置',
  icon: 'i-heroicons-arrow-trending-up',
  to: '/vibration/parameter'
},
  {
  id: 'reatime',
  label: '实时监测',
  icon: 'i-heroicons-chart-bar',
  to: '/vibration',
  exact: true
},  {
  id: 'abnormal',
  label: '异常数据',
  icon: 'i-heroicons-exclaimation-triangle',
  to: '/vibration/abnormal'
}]]
</script>