<template>
  <div class="report-generation-container">
    <!-- 标题和操作区 -->
    <div class="report-header">
      <h2>报告生成</h2>
      <div class="action-buttons">
        <el-button type="primary" @click="showJobDialog" size="large">
          <el-icon v-if="selectedJob == null"><plus /></el-icon>
          <span>{{ selectedJob == null ? '选择分析任务': `【${selectedJob.job_name}】`}}</span>
        </el-button>
        <el-button type="primary" @click="handleGenerateReport" size="large">
          <el-icon><document /></el-icon>
          <span>生成报告</span>
        </el-button>
      </div>
    </div>

    <!-- 分析任务选择 -->
    <div class="task-selection">
      <el-dialog
        title="选择分析任务"
        v-model="jobDialogVisible"
        style="width: 200vh;"
      >
        <JobsView @job-selected="handleJobSelected" />
      </el-dialog>
    </div>

    <!-- 报告预览 -->
    <el-card>
      <div class="report-preview">
        <div v-if="generatedReport" class="preview-content">
          <h3>报告预览</h3>
          <div v-html="generatedReport"></div>
          <iframe v-if="generatedReport" :src="generatedReport" width="100%" height="600px" />
        </div>
        <div v-else class="placeholder">
          <el-empty>请先选择分析任务并生成报告</el-empty>
        </div>
      </div>
    </el-card>

    <!-- 生成报告确认对话框 -->
    <el-dialog
      v-model="confirmDialogVisible"
      title="生成报告确认"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="report-confirm-content">
        <h4>当前分析任务包含以下内容：</h4>

        <div class="confirm-section">
          <h5>分析维度</h5>
          <ul class="check-list">
            <li v-for="item in reportChecklist.dimensions" :key="item.name">
              <span>{{ item.name }}</span>
              <el-icon :color="item.has ? '#67C23A' : '#F56C6C'">
                <component :is="item.has ? 'Check' : 'Close'" />
              </el-icon>
            </li>
          </ul>
        </div>

        <div class="confirm-section">
          <h5>可视化图表</h5>
          <ul class="check-list">
            <li v-for="item in reportChecklist.visualizations" :key="item.name">
              <span>{{ item.name }}</span>
              <!-- <el-icon :color="item.has ? '#67C23A' : '#F56C6C'">
                <component :is="item.has ? 'Check' : 'Close'" />
              </el-icon> -->
              <span>已生成{{ item.completed }}份</span>
            </li>
          </ul>
        </div>

        <div class="confirm-tips">
          <el-alert type="info" :closable="false">
            提示：标记为 <el-icon color="#67C23A"><Check /></el-icon> 的项目将被包含在报告中，
            标记为 <el-icon color="#F56C6C"><Close /></el-icon> 的项目将不会出现在报告中。
            维度分析请另开任务，可视化图表可以生成后上传即可。
          </el-alert>
        </div>
      </div>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmGenerateReport">确认生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';
import { Document, Plus, Check, Close } from '@element-plus/icons-vue';
import JobsView from '../views/AnalysisJobView.vue'
import axios from 'axios';
import { apiUrl } from '../config';
import { errorMessages } from 'vue/compiler-sfc';

// 生成报告相关
const generatedReport = ref(null);
const confirmDialogVisible = ref(false);
const reportChecklist = ref({
  dimensions: [],
  visualizations: []
});

const jobDialogVisible = ref(false);
const selectedJob = ref(null);
const selectedJobID = ref(null);
const job_id = ref(null)

function handleJobSelected(row: { id: string; job_name: any } | null) {
  selectedJob.value = row
  console.log('选中的任务：', row)
  if(row) {
    job_id.value = row.id
    selectedJobID.value = row.id
  }
  jobDialogVisible.value = false
}

const showJobDialog = () => {
  jobDialogVisible.value = true
}

const handleGenerateReport = async () => {
  if (!selectedJob.value) {
    ElMessage.warning('请选择分析任务');
    return;
  }
  let loading = null;
  try {
    // 显示加载框
    loading = ElLoading.service({
      lock: true,
      text: '正在获取报告内容清单...',
      background: 'rgba(0, 0, 0, 0.7)',
    });

    // 请求接口，设置超时时间为10秒
    const response = await axios.get(`${apiUrl}/reports/${selectedJobID.value}/checklist/`, {
      timeout: 10000,
    });
    console.log(response.data.data)
    reportChecklist.value = response.data.data;
    confirmDialogVisible.value = true;

  } catch (error) {
    let errorMessage = "生成报告信息获取失败！";
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    ElMessage.error(errorMessage);

  } finally {
    if (loading) loading.close();
  }
};

const confirmGenerateReport = async () => {
  confirmDialogVisible.value = false;
  
  try {
    const res = await generateReportApi();
    generatedReport.value = res.data;
    ElMessage.success('报告生成成功');
  } catch (error) {
    console.error('报告生成失败');
  }
};

const reportDetails = ref(null)
const generateReportApi = async () => {
  try {
    const response = await axios.post(`${apiUrl}/reports/generate/`, {
      job_id: selectedJobID.value,
    });

    reportDetails.value = response.data;

    // 获取 PDF Blob
    const responsePreview = await axios.get(
      `${apiUrl}/reports/${selectedJobID.value}/download/`,
      { responseType: 'blob' }
    );

    // 创建 blob URL 用于预览
    const fileURL = URL.createObjectURL(new Blob([responsePreview.data], { type: 'application/pdf' }));

    // 在新窗口预览 PDF
    window.open(fileURL);

    // 可选：绑定 URL 到组件状态中用于 iframe 预览
    generatedReport.value = fileURL;

    return { data: fileURL };

  } catch (error) {
    const errorMessage = error.response?.data?.message || '报告生成失败，请稍后重试';
    ElMessage.error(errorMessage);
    console.error(error);
    throw error;
  }
};
</script>

<style scoped lang="scss">
.report-generation-container {
  padding: 20px;
  height: 150%;
  display: flex;
  flex-direction: column;
  width: 100%;

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

  .task-selection {
    margin-bottom: 20px;
  }

  .report-preview {
    flex: 1;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 20px;

    .preview-content {
      h3 {
        font-size: 18px;
        color: #333;
        margin-bottom: 20px;
      }

      .el-button {
        margin-top: 20px;
      }
    }

    .placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      color: #999;
    }
  }

  .report-confirm-content {
    h4 {
      margin-bottom: 20px;
      color: #333;
    }

    .confirm-section {
      margin-bottom: 20px;

      h5 {
        margin-bottom: 10px;
        color: #666;
        font-size: 16px;
      }
    }

    .check-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;

      li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background-color: #f5f7fa;
        border-radius: 4px;

        span {
          flex: 1;
        }

        .el-icon {
          margin-left: 10px;
        }
      }
    }

    .confirm-tips {
      margin-top: 20px;
    }
  }
}
</style>