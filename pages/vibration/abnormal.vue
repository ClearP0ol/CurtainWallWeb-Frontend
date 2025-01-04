<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <div class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-xl font-semibold">异常数据监控</h1>
        <el-button type="primary" @click="router.push('/subindex')">返回主页</el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="container mx-auto px-4 py-6">
      <!-- 筛选条件 -->
      <div class="bg-white rounded p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- 设备选择 -->
          <div>
            <label class="block mb-2">设备选择</label>
            <el-select 
              v-model="params.device"
              placeholder="请选择设备"
              class="w-full"
              :disabled="loading"
            >
              <el-option
                v-for="device in deviceList"
                :key="device.device_id"
                :label="device.device_name"
                :value="device.device_id"
              />
            </el-select>
          </div>

          <!-- 方向选择 -->
          <div>
            <label class="block mb-2">异常方向</label>
            <el-select
              v-model="params.direction"
              placeholder="请选择方向"
              class="w-full"
              :disabled="loading"
            >
              <el-option
                v-for="item in directions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>

          <!-- 时间选择 -->
          <div class="md:col-span-2">
            <label class="block mb-2">时间范围</label>
            <div class="flex items-center space-x-2">
              <el-date-picker
                v-model="params.start_time"
                type="datetime"
                placeholder="开始时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="!w-[220px]"
                :disabled="loading"
              />
              <span class="text-gray-500">至</span>
              <el-date-picker
                v-model="params.end_time"
                type="datetime"
                placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="!w-[220px]"
                :disabled="loading"
              />
            </div>
          </div>
        </div>

        <!-- 查询按钮 -->
        <div class="flex justify-end mt-4 space-x-4">
          <el-button 
            type="primary" 
            @click="handleSearch"
            :loading="loading"
            :disabled="!params.device || !params.start_time || !params.end_time || !params.direction"
          >
            查询
          </el-button>
          <el-button 
            type="primary" 
            @click="downloadData"
            :loading="loading"
            :disabled="!params.device || !params.start_time || !params.end_time || !params.direction"
          >
            导出数据
          </el-button>
        </div>
      </div>

      <!-- 数据显示区域 -->
      <div class="bg-white rounded p-4">
        <!-- 添加 flex 容器使表格居中 -->
        <div class="flex justify-center w-full">
          <div v-if="loading" class="h-[500px] flex items-center justify-center">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>
          <div v-else-if="chartData && chartData.length > 0" class="table-container w-[90%]">
            <el-table 
              :data="chartData" 
              border 
              style="width: 100%"
              height="500"
              :max-height="500"
            >
              <el-table-column prop="device_id" label="设备ID" min-width="120" fixed />
              <el-table-column label="设备名称" min-width="120" fixed>
                <template #default="scope">
                  {{ getDeviceName(scope.row.device_id) }}
                </template>
              </el-table-column>
              <el-table-column prop="time" label="时间" min-width="180" />
              <el-table-column prop="data" label="数据值" min-width="120" />
              <el-table-column prop="direction" label="方向" min-width="150">
                <template #default="scope">
                  {{ getDirectionLabel(scope.row.direction) }}
                </template>
              </el-table-column>
              <el-table-column prop="min" label="最小阈值" min-width="120" />
              <el-table-column prop="max" label="最大阈值" min-width="120" />
            </el-table>
          </div>
          <el-empty v-else description="暂无数据" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { sub } from 'date-fns'
import { useFetch } from '@vueuse/core'
import { Loading } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 基础数据初始化
const loading = ref(false)
const deviceList = ref([
  { device_id: '29FA1867', device_name: '安楼05' },
  { device_id: '4787BE3A', device_name: '综合楼05' },
  { device_id: '612B04ED', device_name: '综合楼02' },
  { device_id: '8361D7CD', device_name: '综合楼03' },
  { device_id: '87C3D4E4', device_name: '安楼04' },
  { device_id: '8850A7D7', device_name: '综合楼04' },
  { device_id: '9A0D1958', device_name: '安楼03' },
  { device_id: 'A77C5238', device_name: '安楼01' },
  { device_id: 'E43AC643', device_name: '安楼06' },
  { device_id: 'E884C99D', device_name: '综01' },
  { device_id: 'F001', device_name: '风压' },
  { device_id: 'F853ED49', device_name: '安楼02' }
])
const chartData = ref(null)

// 方向选项
const directions = [
  { value: 'x_above_max', label: 'X轴超过最大值' },
  { value: 'x_below_min', label: 'X轴低于最小值' },
  { value: 'y_above_max', label: 'Y轴超过最大值' },
  { value: 'y_below_min', label: 'Y轴低于最小值' },
  { value: 'z_above_max', label: 'Z轴超过最大值' },
  { value: 'z_below_min', label: 'Z轴低于最小值' }
]

// 请求数初始化
const params = reactive({
  device: '',
  direction: 'x_above_max',
  start_time: '',
  end_time: ''
})

// 更新方向标签转换函数
const getDirectionLabel = (direction) => {
  const directionMap = {
    'x_above_max': 'X轴超过最大值',
    'x_below_min': 'X轴低于最小值',
    'y_above_max': 'Y轴超过最大值',
    'y_below_min': 'Y轴低于最小值',
    'z_above_max': 'Z轴超过最大值',
    'z_below_min': 'Z轴低于最小值'
  }
  return directionMap[direction] || direction
}

// 获取图表数据
const fetchData = async () => {
  loading.value = true
  try {
    const response = await fetch(`http://110.42.214.164:8009/data/get_abnormal_data?${new URLSearchParams(params)}`)
    const result = await response.json()
    
    if (result.status === 'success' && Array.isArray(result.data)) {
      chartData.value = result.data
      console.log('获取到数据:', chartData.value)
    } else {
      chartData.value = null
      ElMessage.warning(result.status === 'error' ? '获取数据失败' : '未获取到数据')
    }
  } catch (err) {
    console.error('请求失败:', err)
    ElMessage.error('获取数据失败')
    chartData.value = null
  } finally {
    loading.value = false
  }
}

// 查询按钮点击处理
const handleSearch = async () => {
  if (!params.device || !params.direction || !params.start_time || !params.end_time) {
    ElMessage.warning('请选择完整的查询条件')
    return
  }

  if (new Date(params.start_time) > new Date(params.end_time)) {
    ElMessage.warning('开始时间不能晚于结束时间')
    return
  }

  console.log('开始查询，参数:', params)
  await fetchData()
}

// 不再在参数改变时立即触发查询
const handleDeviceChange = (val) => {
  params.device = val
}

const handleDirectionChange = (val) => {
  params.direction = val
}

// 下载数据
const downloadData = async () => {
  try {
    const response = await fetch(
      'http://110.42.214.164:8009/data/download_abnormal_data?' + 
      new URLSearchParams(params)
    )
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `异常数据_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
    ElMessage.success('下载成功')
  } catch {
    ElMessage.error('下载失败')
  }
}

// 处理窗口大小变化
const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

// 初始化
onMounted(() => {
  // 设置默认设备
  params.device = deviceList.value[0].device_id
  
  // 设置默认方向
  params.direction = 'y_above_max'
  
  // 设置默认时间范围
  const end = new Date()
  const start = sub(end, { days: 7 })
  
  params.start_time = start.toISOString().slice(0, 19).replace('T', ' ')
  params.end_time = end.toISOString().slice(0, 19).replace('T', ' ')
  
  console.log('初始化完成:', params)
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
    chart = null
  }
  window.removeEventListener('resize', handleResize)
})

// 添加设备名称查找函数
const getDeviceName = (deviceId) => {
  const device = deviceList.value.find(item => item.device_id === deviceId)
  return device ? device.device_name : deviceId
}

let chart = null; // 定义图表实例变量
</script>

<style scoped>
.el-date-editor.el-input,
.el-date-editor.el-input__wrapper {
  width: 100%;
}

/* 表格容器样式 */
.table-container {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin: 0 auto;
  width: 90%;
}

/* 确保表格本身占满容器 */
:deep(.el-table) {
  width: 100% !important;
}

/* 表格样式优化 */
.el-table {
  margin-top: 1rem;
}

.el-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
  text-align: center;
}

.el-table td {
  padding: 8px 0;
  text-align: center;
}

/* 设置滚动条样式 */
:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background: #dcdfe6;
  border-radius: 4px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: #f5f7fa;
}

/* 确保表格内容居中 */
:deep(.el-table .cell) {
  text-align: center;
}
</style>