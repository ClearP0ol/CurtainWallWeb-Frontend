<template>
  <div class="report-management-container">
    <!-- 标题和操作区 -->
    <div class="report-header">
      <h2>历史报告管理</h2>
      <div class="action-buttons">
        <el-button type="primary" @click="generateNewReport">
          <el-icon><document-add /></el-icon>
          <span>生成新报告</span>
        </el-button>
        <el-button @click="refreshReports">
          <el-icon><refresh /></el-icon>
          <span>刷新列表</span>
        </el-button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <el-card shadow="hover" class="filter-panel">
      <el-form :inline="true" :model="filterForm">
        <!-- <el-form-item label="报告类型">
          <el-select
            v-model="filterForm.reportType"
            placeholder="全部类型"
            clearable
          >
            <el-option
              v-for="type in reportTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item> -->
        
        <el-form-item label="生成时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <!-- <el-form-item label="生成人员">
          <el-select
            v-model="filterForm.creator"
            placeholder="全部人员"
            clearable
            filterable
          >
            <el-option
              v-for="user in creators"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item> -->
        
        <el-form-item label="关键字">
          <el-input
            v-model="filterForm.keyword"
            placeholder="报告名称/描述"
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 报告列表 -->
    <el-card shadow="hover" class="report-list-card">
      <el-table
        :data="filteredReports"
        style="width: 100%"
        v-loading="loading"
        stripe
        @sort-change="handleSortChange"
      >
        <el-table-column
          prop="name"
          label="报告名称"
          width="320"
          sortable
        >
          <template #default="{ row }">
            <div class="report-name-cell">
              <el-icon :size="20" color="#409EFF">
                <document />
              </el-icon>
              <span class="name-text">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="job_name"
          label="任务名称"
          width="340"
        >
          <template #default="{ row }">
              {{ getReportTypeText(row.job_name) }}
          </template>
        </el-table-column>
        
        <el-table-column
          prop="size"
          label="文件大小"
          width="150"
          sortable
        >
          <template #default="{ row }">
            {{ formatFileSize(row.size) }}
          </template>
        </el-table-column>
        
        <!-- <el-table-column
          prop="creator"
          label="生成人员"
          width="150"
        >
          <template #default="{ row }">
            <div class="creator-cell">
              <el-avatar :size="24" :src="row.creatorAvatar" />
              <span class="creator-name">{{ row.creatorName }}</span>
            </div>
          </template>
        </el-table-column> -->
        
        <el-table-column
          prop="generation_time"
          label="生成时间"
          width="180"
          sortable
        >
          <template #default="{ row }">
            {{ formatDateTime(row.generation_time) }}
          </template>
        </el-table-column>
        
        <el-table-column
          label="操作"
          width="180"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button size="small" @click="downloadReport(row)">
              <el-icon><download /></el-icon>
              <span>下载</span>
            </el-button>
            <el-button size="small" type="danger" @click="deleteReport(row)">
              <el-icon><delete /></el-icon>
              <span>删除</span>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalReports"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 报告预览对话框 -->
    <!-- <el-dialog
      v-model="previewDialogVisible"
      :title="`报告预览 - ${currentReport?.name || ''}`"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <div v-if="currentReport" class="report-preview">
        <div class="preview-header">
          <div class="report-info">
            <div class="info-item">
              <span class="label">报告类型：</span>
              <el-tag :type="getReportTypeTag(currentReport.type)">
                {{ getReportTypeText(currentReport.type) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">文件大小：</span>
              <span>{{ formatFileSize(currentReport.size) }}</span>
            </div>
            <div class="info-item">
              <span class="label">生成时间：</span>
              <span>{{ formatDateTime(currentReport.createdAt) }}</span>
            </div>
          </div>
          
          <div class="preview-actions">
            <el-button type="primary" @click="downloadReport(currentReport)">
              <el-icon><download /></el-icon>
              <span>下载报告</span>
            </el-button>
            <el-button @click="printReport(currentReport)">
              <el-icon><printer /></el-icon>
              <span>打印</span>
            </el-button>
          </div>
        </div>
        
        <div class="preview-content">
          <div v-if="isPdfReport(currentReport.type)" class="pdf-preview">
            <el-icon :size="48" color="#E74C3C"><document /></el-icon>
            <p>PDF 报告预览</p>
            <div class="placeholder-image" />
          </div>
          
          <div v-else-if="isWordReport(currentReport.type)" class="word-preview">
            <el-icon :size="48" color="#2B579A"><document /></el-icon>
            <p>Word 报告预览</p>
            <div class="placeholder-image" />
          </div>
          
          <div v-else class="unknown-preview">
            <el-icon :size="48" color="#909399"><question-filled /></el-icon>
            <p>不支持预览此文件类型</p>
          </div>
        </div>
      </div>
    </el-dialog> -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  DocumentAdd,
  Refresh,
  View,
  Delete,
  Download,
  Printer,
  QuestionFilled
} from '@element-plus/icons-vue'
import { formatDateTime, formatFileSize } from '../utils/format'
import { apiUrl } from '../config'
const router = useRouter()
// 报告数据
const reports = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalReports = ref(0)
const currentReport = ref(null)
const previewDialogVisible = ref(false)

// 筛选表单
const filterForm = ref({
  reportType: '',
  creator: '',
  dateRange: [],
  keyword: '',
  sortField: '',
  sortOrder: ''
})

// 报告类型选项
const reportTypes = ref([
  { value: 'structure', label: '结构分析报告' },
  { value: 'thermal', label: '热力学报告' },
  { value: 'wind', label: '风荷载报告' },
  { value: 'comprehensive', label: '综合评估报告' },
  { value: 'inspection', label: '检测报告' }
])

// 计算属性 - 筛选后的报告
const filteredReports = computed(() => {
  let result = [...reports.value]
  
  // 报告类型筛选
  if (filterForm.value.reportType) {
    result = result.filter(report => report.type === filterForm.value.reportType)
  }
  
  // 生成人员筛选
  if (filterForm.value.creator) {
    result = result.filter(report => report.creatorId === filterForm.value.creator)
  }
  
  // 日期范围筛选
  if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
    const [start, end] = filterForm.value.dateRange
    result = result.filter(report => {
      const reportDate = report.createdAt.split('T')[0]
      return reportDate >= start && reportDate <= end
    })
  }
  
  // 关键字筛选
  if (filterForm.value.keyword) {
    const keyword = filterForm.value.keyword.toLowerCase()
    result = result.filter(report => 
      report.name.toLowerCase().includes(keyword) ||
      report.description?.toLowerCase().includes(keyword))
  }
  
  // 排序
  if (filterForm.value.sortField) {
    result.sort((a, b) => {
      const field = filterForm.value.sortField
      const order = filterForm.value.sortOrder === 'ascending' ? 1 : -1
      
      if (a[field] > b[field]) return order
      if (a[field] < b[field]) return -order
      return 0
    })
  }
  
  // 分页
  return result.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
})

// 方法
const fetchReports = async () => {
  loading.value = true
  try {
    const response = await getReports({
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filterForm.value
    })
    reports.value = response.results
    totalReports.value = response.count
    // ElMessage.success('获取报告列表成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('获取报告列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  currentPage.value = 1
  fetchReports()
}

const resetFilter = () => {
  filterForm.value = {
    reportType: '',
    creator: '',
    dateRange: [],
    keyword: '',
    sortField: '',
    sortOrder: ''
  }
  handleFilter()
}

const handleSortChange = ({ prop, order }) => {
  filterForm.value.sortField = prop
  filterForm.value.sortOrder = order
  fetchReports()
}

const previewReport = (report) => {
  currentReport.value = report
  previewDialogVisible.value = true
}

const downloadReport = async (report) => {
  try {
    ElMessage.info(`开始下载: ${report.name}`)
    // 创建隐藏的a标签触发下载
    const link = document.createElement('a')
    link.href = `${apiUrl}/reports/${report.id}/history/download/`
    link.download = `${report.name}.pdf`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('下载请求已发送')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

const printReport = (report) => {
  ElMessage.success(`打印请求已发送: ${report.name}`)
  // 实际项目中这里会调用打印API
}

const deleteReport = async (report) => {
  try {
    await ElMessageBox.confirm(
      `确定删除【${report.name}】吗？此操作不可逆！`,
      '删除确认',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await axios.delete(`${apiUrl}/reports/${report.id}/delete/`)
    
    if (response.data.code === 200) {
      ElMessage.success({
        message: response.data.message || '删除成功',
        duration: 2000
      })
      await fetchReports() // 刷新列表
    }

  } catch (error) {
    if (error.response) {
      // 处理标准错误响应
      const res = error.response.data
      ElMessage.error(res.message || '删除失败')
    } else if (error !== 'cancel') {
      ElMessage.error('请求发送失败')
    }
  }
}

const generateNewReport = () => {
  // 跳转到生成报告页面
  router.push('/reports/generate')
  ElMessage.info('跳转到报告生成页面')
}

const refreshReports = () => {
  fetchReports()
}

const getReportTypeTag = (type) => {
  const map = {
    structure: '',
    thermal: 'success',
    wind: 'warning',
    comprehensive: 'danger',
    inspection: 'info'
  }
  return map[type] || ''
}

const getReportTypeText = (type) => {
  const found = reportTypes.value.find(item => item.value === type)
  return found ? found.label : type
}

const isPdfReport = (type) => type === 'structure' || type === 'comprehensive'
const isWordReport = (type) => type === 'inspection' || type === 'thermal' || type === 'wind'

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchReports()
}

const handlePageChange = (val) => {
  currentPage.value = val
  fetchReports()
}


const getReports = async (params) => {
  try {
    const response = await axios.get(`${apiUrl}/reports/history`, { params })
    return response.data.data
  } catch (error) {
    console.error(error) 
  }
}


// 生命周期
onMounted(() => {
  fetchReports()
})
</script>

<style scoped lang="scss">
.report-management-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      font-size: 24px;
      color: #333;
      margin: 0;
    }
  }
  
  .filter-panel {
    margin-bottom: 20px;
    
    .el-form {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      
      .el-form-item {
        margin-bottom: 0;
      }
    }
  }
  
  .report-list-card {
    flex: 1;
    
    :deep(.el-card__body) {
      padding: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .el-table {
      flex: 1;
      
      .report-name-cell {
        display: flex;
        align-items: center;
        
        .el-icon {
          margin-right: 8px;
        }
        
        .name-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      
      .creator-cell {
        display: flex;
        align-items: center;
        
        .el-avatar {
          margin-right: 8px;
        }
        
        .creator-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
    
    .pagination-container {
      padding: 16px;
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid #eee;
    }
  }
  
  .report-preview {
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
      
      .report-info {
        display: flex;
        gap: 30px;
        
        .info-item {
          display: flex;
          align-items: center;
          
          .label {
            color: #666;
            margin-right: 8px;
          }
        }
      }
    }
    
    .preview-content {
      min-height: 500px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px dashed #ddd;
      border-radius: 8px;
      padding: 40px;
      
      .el-icon {
        margin-bottom: 20px;
      }
      
      p {
        font-size: 18px;
        color: #333;
        margin-bottom: 20px;
      }
      
      .placeholder-image {
        width: 80%;
        height: 400px;
        background-color: #f5f7fa;
        border-radius: 4px;
        border: 1px solid #e4e7ed;
      }
    }
  }
}
</style>