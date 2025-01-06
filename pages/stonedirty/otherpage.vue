<template>
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <div class="header-bar">
        <h2 class="page-title">历史记录</h2>

        <!-- 添加时间筛选 -->
        <div class="filter-section">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
            value-format="YYYY-MM-DD HH:mm:ss"
            :default-time="[
              new Date(2000, 1, 1, 0, 0, 0),
              new Date(2000, 1, 1, 23, 59, 59)
            ]"
            @change="handleDateChange"
          />
          <el-button
            type="primary"
            class="filter-button"
            @click="applyFilter"
          >
            <template #icon>
              <el-icon><Search /></el-icon>
            </template>
            筛选
          </el-button>
          <el-button
            type="info"
            class="reset-button"
            @click="resetFilter"
          >
            <template #icon>
              <el-icon><Refresh /></el-icon>
            </template>
            重置
          </el-button>
        </div>

        <el-button
          type="primary"
          class="detect-button back-button"
          @click="backToMain"
        >
          <template #icon>
            <el-icon><ArrowLeft /></el-icon>
          </template>
          返回主页
        </el-button>
      </div>

      <!-- 历史记录展示区域 -->
      <div v-loading="loading" class="results-section">
        <div class="section">
          <h3 class="section-title">历史检测记录</h3>
          <div class="results-wall">
            <div
              v-for="(item, index) in filteredData"
              :key="index"
              class="result-item"
            >
              <!-- 图片分析部分 -->
              <div class="section">
                <h3 class="section-title">图片分析</h3>
                <div class="image-comparison">
                  <div class="image-box">
                    <div class="image-label">原始图片</div>
                    <el-image
                      :src="validateImageUrl(item.input_url)"
                      :preview-src-list="item.input_url ? [validateImageUrl(item.input_url)] : []"
                      :initial-index="0"
                      fit="contain"
                      preview-teleported
                      hide-on-click-modal
                      lazy>
                    </el-image>
                  </div>
                  <div class="image-box" v-if="item.annotated_image_url">
                    <div class="image-label">标注结果</div>
                    <el-image
                      :src="validateImageUrl(item.annotated_image_url)"
                      :preview-src-list="item.annotated_image_url ? [validateImageUrl(item.annotated_image_url)] : []"
                      :initial-index="0"
                      fit="contain"
                      preview-teleported
                      hide-on-click-modal
                      lazy>
                    </el-image>
                  </div>
                </div>
              </div>

              <!-- 检测结果部分 -->
              <div class="section">
                <h3 class="section-title">检测结果</h3>
                <div class="results-wall">
                  <div
                    v-for="(result, resultIndex) in item.detectionResults"
                    :key="resultIndex"
                    class="detection-result"
                  >
                    <div class="image-pair">
                      <div class="stain-image" v-if="result.warped_image_url">
                        <div class="image-label">污渍区域 {{ resultIndex + 1 }}</div>
                        <el-image
                          :src="validateImageUrl(result.warped_image_url)"
                          :preview-src-list="[validateImageUrl(result.warped_image_url)]"
                          :initial-index="0"
                          preview-teleported
                          hide-on-click-modal
                          fit="cover"
                          class="result-image"
                          lazy>
                        </el-image>
                      </div>

                      <div class="arrow-icon">→</div>

                      <div class="processed-image" v-if="result.result_image_url">
                        <div class="image-label">处理结果 {{ resultIndex + 1 }}</div>
                        <el-image
                          :src="validateImageUrl(result.result_image_url)"
                          :preview-src-list="[validateImageUrl(result.result_image_url)]"
                          :initial-index="0"
                          preview-teleported
                          hide-on-click-modal
                          fit="cover"
                          class="result-image"
                          @error="handleImageError"
                          @load="handleImageSuccess"
                          lazy>
                          <template #error>
                            <div class="image-error">
                              <el-icon><Warning /></el-icon>
                              <span>图片加载失败</span>
                            </div>
                          </template>
                          <template #placeholder>
                            <div class="image-placeholder">
                              <el-icon><Loading /></el-icon>
                              <span>加载中...</span>
                            </div>
                          </template>
                        </el-image>
                      </div>

                      <!-- 污渍百分比显示 -->
                      <div class="percentage-badge" v-if="result.stain_percentage !== undefined">
                        <el-icon class="percentage-icon"><Warning /></el-icon>
                        <span class="percentage-text">污渍占比</span>
                        <span class="percentage-value">
                          {{ Number(result.stain_percentage).toFixed(2) }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 记录信息 -->
              <div class="record-info">
                <span class="info-item">
                  <el-icon><Clock /></el-icon>
                  检测时间: {{ formatDate(item.created_at) }}
                </span>
                <span class="info-item">
                  <el-icon><Document /></el-icon>
                  记录ID: {{ item.history_id }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>



<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from 'element-plus';
import { getHistory } from '../../api/stain';

// 路由
const router = useRouter();
const backToMain = () => {
  router.push("/");
};

// 定义数据接口
interface TableItem {
  input_url: string;
  annotated_image_url?: string;
  warped_image_url?: string;
  result_image_url?: string;
  stain_percentage?: number;
  created_at: string;
  history_id: number;
}

const tableData = ref<TableItem[]>([]); // 存储所有数据
const filteredData = ref<TableItem[]>([]); // 存储筛选后的数据
const loading = ref(true);

// 添加日期相关变量
const dateRange = ref([]);
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return [start, end];
    },
  },
];

// 获取数据
const fetchHistory = async () => {
  try {
    loading.value = true;

    const token = localStorage.getItem('authToken');
    if (!token) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }

    try {
      const jwtModule = await import('jwt-decode');
      const decode = typeof jwtModule.default === 'function'
        ? jwtModule.default(token)
        : jwtModule.jwtDecode(token);

      const username = decode.username;
      if (!username) {
        console.error('Token 中未找到用户名:', decode);
        ElMessage.warning('未获取到用户信息，请重新登录');
        router.push('/login');
        return;
      }

      const params: any = { username };
      const response = await getHistory(params);
      console.log('历史记录响应:', response);

      if (response.status === 'success' && response.data?.length > 0) {
        tableData.value = response.data.map((record: any) => {
          console.log('处理单条记录:', record);

          const baseInfo = {
            input_url: record.input_url,
            created_at: record.created_at,
            history_id: record.history_id
          };

          let processedData = {
            annotated_image_url: '',
            warped_image_url: '',
            result_image_url: '',
            stain_percentage: 0
          };

          if (Array.isArray(record.output_url)) {
            const annotatedImage = record.output_url.find(item => item.annotated_image_url);
            if (annotatedImage) {
              processedData.annotated_image_url = annotatedImage.annotated_image_url;
            }

            const detectionResults = record.output_url
              .filter(item => item.warped_image_url && item.result_image_url && item.result_image_url !== null)
              .map(item => ({
                warped_image_url: item.warped_image_url,
                result_image_url: item.result_image_url,
                stain_percentage: item.stain_percentage
              }));

            if (detectionResults.length > 0) {
              processedData.detectionResults = detectionResults;
            }
          }

          const processedRecord = {
            ...baseInfo,
            ...processedData
          };

          console.log('处理后的记录:', processedRecord);
          return processedRecord;
        });

        // 初始化时展示所有记录
        filteredData.value = [...tableData.value];

        console.log('最终处理后的数据:', tableData.value);
      } else {
        ElMessage.info('暂无历史记录');
      }
    } catch (decodeError) {
      console.error('Token 解析失败:', decodeError);
      ElMessage.error('登录信息已过期，请重新登录');
      localStorage.removeItem('authToken');
      router.push('/login');
      return;
    }
  } catch (error) {
    console.error('获取历史记录失败:', error);
    ElMessage.error('获取历史记录失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 在组件挂载时获取所有历史记录
onMounted(() => {
  fetchHistory();
});

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 处理日期变化
const handleDateChange = (val: any) => {
  console.log('日期范围变化:', val);
};

// 应用筛选（在前端进行）
const applyFilter = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    let [start, end] = dateRange.value;

    // 确保 start 和 end 是 Date 对象
    if (!(start instanceof Date)) {
      start = new Date(start);
    }
    if (!(end instanceof Date)) {
      end = new Date(end);
    }

    // 修正时间格式：开始日期设置为 00:00:00，结束日期设置为 23:59:59
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // 筛选数据
    filteredData.value = tableData.value.filter(item => {
      const createdAt = new Date(item.created_at);
      return createdAt >= start && createdAt <= end;
    });

    console.log('筛选后的数据:', filteredData.value);
  } else {
    ElMessage.warning('请选择完整的日期范围');
  }
};

// 重置筛选
const resetFilter = () => {
  dateRange.value = [];
  filteredData.value = [...tableData.value]; // 恢复所有数据
};

// 图片 URL 验证
const validateImageUrl = (url: string) => {
  if (!url) return '';
  try {
    // 检查是否是完整的 URL
    if (url.startsWith('http')) {
      return url;
    }
    // 如果是相对路径，添加基础 URL
    return `http://110.42.214.164:9000${url}`;
  } catch (error) {
    console.error('处理图片 URL 失败:', error);
    return '';
  }
};
</script>




<style scoped>
.page-wrapper {
  position: fixed;
  top: 0;
  left: 200px;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.main-container {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
}

.results-section {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 0;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
  padding-left: 12px;
  border-left: 4px solid #409EFF;
}

.results-wall {
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 20px 0;
}

.result-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.result-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.image-comparison {
  display: flex;
  gap: 30px;
  margin-bottom: 30px;
  width: 100%;
}

.image-box {
  flex: 1;
  min-width: 0;
}

.image-pair {
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
}

.stain-image,
.processed-image {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
}

.result-image {
  width: 100%;
  height: 240px;
  object-fit: cover;
}

.arrow-icon {
  font-size: 24px;
  color: #409EFF;
  margin: 0 12px;
  animation: pulse 2s infinite;
}

/* 污渍百分比标签样式 */
.percentage-badge {
  position: absolute;
  top: -15px;
  right: -15px;
  background: linear-gradient(135deg, #409EFF, #36D1DC);
  padding: 10px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.percentage-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.3);
}

.percentage-icon {
  font-size: 16px;
  animation: pulse 2s infinite;
}

.percentage-text {
  font-size: 12px;
  opacity: 0.9;
}

.percentage-value {
  font-size: 14px;
  font-weight: 600;
}

/* 记录信息样式 */
.record-info {
  margin-top: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  gap: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.info-item .el-icon {
  color: #409EFF;
}

/* 顶部导航栏样式 */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 返回按钮样式 */
.back-button {
  min-width: 120px;
  height: 40px;
  font-size: 15px;
  font-weight: 500;
  padding: 0 24px;
  border-radius: 8px;
  background: linear-gradient(135deg, #409EFF, #36D1DC);
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button:hover {
  transform: translateX(-3px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  background: linear-gradient(135deg, #66b1ff, #40E0D0);
}

/* 动画效果 */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

/* 响应式布局 */
@media screen and (max-width: 1400px) {
  .image-pair {
    gap: 24px;
  }

  .result-image {
    height: 240px;
  }
}

@media screen and (max-width: 768px) {
  .image-pair {
    flex-direction: column;
  }

  .arrow-icon {
    transform: rotate(90deg);
    margin: 20px 0;
  }

  .result-image {
    height: 200px;
  }
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
}

.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: #f56c6c;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
}

.image-placeholder .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 添加筛选区域样式 */
.filter-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-button,
.reset-button {
  min-width: 90px;
  height: 40px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 修改日期选择器样式 */
:deep(.el-date-editor) {
  width: 360px;
}

.detection-result {
  padding: 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.detection-result:last-child {
  margin-bottom: 0;
}

.detection-result:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-label {
  font-weight: 500;
  color: #409EFF;
}
</style>