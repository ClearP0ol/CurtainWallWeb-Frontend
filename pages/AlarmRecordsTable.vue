<template>
  <div class="alarm-records-table">
    <el-table
      :data="records"
      style="width: 100%"
      :stripe="true"
      :border="true"
      height="calc(100vh - 200px)"
    >
      <el-table-column
        prop="time"
        label="时间"
        width="180"
        sortable
      />
      <el-table-column
        prop="content"
        label="报警内容"
        width="120"
      />
      <el-table-column
        prop="device"
        label="设备ID"
        width="120"
      >
        <template #default="scope">
          <el-tag>{{ getDeviceName(scope.row.device) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="severity"
        label="严重程度"
        width="100"
      >
        <template #default="scope">
          <el-tag :type="getSeverityType(scope.row.severity)">
            {{ getSeverityLabel(scope.row.severity) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="call_function"
        label="通知方式"
        width="100"
      >
        <template #default="scope">
          <el-tag type="info">{{ getCallFunctionLabel(scope.row.call_function) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="phone"
        label="联系电话"
        width="120"
      />
      <el-table-column
        prop="email"
        label="邮箱"
        min-width="180"
      >
        <template #default="scope">
          {{ scope.row.email || '未设置' }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  records: any[]
}>();

// 设备名称映射
const deviceMap = {
  'F001': '风压',
  '4787BE3A': '综合楼05',
  '8850A7D7': '综合楼04',
  '8361D7CD': '综合楼03',
  '612B04ED': '综合楼02',
  'E884C99D': '综合楼01',
  'E43AC643': '安楼06',
  '29FA1867': '安楼05',
  '87C3D4E4': '安楼04',
  '9A0D1958': '安楼03',
  'F853ED49': '安楼02',
  'A77C5238': '安楼01'
};

// 获取设备名称
const getDeviceName = (deviceId: string) => {
  return deviceMap[deviceId] || deviceId;
};

// 获取严重程度标签样式
const getSeverityType = (severity: string) => {
  const types = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  };
  return types[severity] || 'info';
};

// 获取严重程度中文标签
const getSeverityLabel = (severity: string) => {
  const labels = {
    'high': '高',
    'medium': '中',
    'low': '低'
  };
  return labels[severity] || severity;
};

// 获取通知方式中文标签
const getCallFunctionLabel = (callFunction: string) => {
  const labels = {
    'phone': '电话',
    'email': '邮件',
    'sms': '短信'
  };
  return labels[callFunction] || callFunction;
};
</script>

<style scoped>
.alarm-records-table {
  padding: 20px;
}

:deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-border: 1px solid var(--el-table-border-color);
  --el-table-text-color: var(--el-text-color-regular);
  --el-table-header-text-color: var(--el-text-color-secondary);
  --el-table-row-hover-bg-color: var(--el-fill-color-light);
  --el-table-current-row-bg-color: var(--el-color-primary-light-9);
  --el-table-header-bg-color: var(--el-fill-color-light);
  --el-table-fixed-box-shadow: var(--el-box-shadow-light);
  --el-table-bg-color: var(--el-fill-color-blank);
  --el-table-tr-bg-color: var(--el-fill-color-blank);
  --el-table-expanded-cell-bg-color: var(--el-fill-color-blank);
}
</style> 