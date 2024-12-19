<template>
  <div class="container">
    <div class="header">
      <h2>项目历史记录</h2>
      <el-button type="primary" @click="$router.push('/crackdetect')" class="new-project-btn">
        新建项目
      </el-button>
    </div>

    <div class="projects-grid">
      <el-card 
        v-for="project in projects" 
        :key="project.project_id" 
        class="project-card"
        shadow="hover"
      >
        <div class="project-header">
          <h3>{{ project.project_name }}</h3>
          <el-tag size="small" :type="getStatusType(project.status)">
            {{ project.status }}
          </el-tag>
        </div>

        <div class="project-info">
          <p>创建时间：{{ formatDate(project.create_time) }}</p>
          <p>创建者：{{ project.user_name }}</p>
        </div>

        <div class="project-actions">
          <el-button 
            type="primary" 
            link
            @click="continueProject(project)"
          >
            继续检测
          </el-button>
          <el-button 
            type="info" 
            link
            @click="viewDetails(project)"
          >
            查看详情
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more">
      <el-button :loading="loading" @click="loadMore">加载更多</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

const router = useRouter()
const projects = ref([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const pageSize = 12

// 获取项目列表
const fetchProjects = async () => {
  try {
    loading.value = true
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      ElMessage.error('请先登录')
      return
    }

    const decoded = jwtDecode(authToken)
    const response = await axios.get('http://127.0.0.1:5000/getProject', {
      params: {
        user_name: decoded.username,
      }
    })

    if (response.data.error) {
      ElMessage.error(response.data.error)
      return
    }

    // 添加新项目到列表
    projects.value = [...projects.value, ...response.data.projects]
    hasMore.value = response.data.projects.length === pageSize
  } catch (error) {
    ElMessage.error('获取项目列表失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  page.value++
  fetchProjects()
}

// 继续项目
const continueProject = (project) => {
  router.push({
    path: '/crackdetect/UploadImage',
    query: {
      projectName: project.project_name,
      project_id: project.project_id
    }
  })
}

// 查看项目详情
const viewDetails = (project) => {
  // TODO: 实现查看详情功能
  ElMessage.info('查看详情功能开发中')
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取状态标签类型
const getStatusType = (status) => {
  const types = {
    'pending': 'warning',
    'processing': 'primary',
    'completed': 'success',
    'failed': 'danger'
  }
  return types[status] || 'info'
}

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.container {
  padding: 20px;
  background-color: #F5F7FA;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  color: #1989FA;
  margin: 0;
}

.new-project-btn {
  background-color: #1989FA;
  border-color: #1989FA;
}

.new-project-btn:hover {
  background-color: #409EFF;
  border-color: #409EFF;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.project-card {
  background-color: #FFFDFA;
  transition: transform 0.2s;
  border: 1px solid #E4E7ED;
}

.project-card:hover {
  transform: translateY(-5px);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.project-header h3 {
  margin: 0;
  color: #303133;
}

.project-info {
  color: #606266;
  font-size: 14px;
}

.project-info p {
  margin: 5px 0;
}

.project-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}
</style> 