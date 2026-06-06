<template>
<div style="margin-bottom: 8vh;height: 10%;width:102%">
    <p class="small-title">新建项目</p>
    <div style="display: flex;width: 90%;">
        <div style="color: black;margin-left: 2%;margin-right: 3%;line-height: 40px;font-size: 18px;">项目名称</div>
        <el-input v-model="input" style="width: 400px;margin-right: 4%;height: 40px;" placeholder="请输入项目名称" />
        <el-button :disabled="input===''" type="primary" style="height: 40px;" @click="startProject">创建项目</el-button>
    </div>
</div>
<div style="height: 90%;">
    <p class="small-title">历史记录</p>
    <el-scrollbar style="width:100%;height:75%;">
        <div class="flex-container">
            <el-card class="history-card"
                v-for="(item, index) in historyItems"
                :key="index"
                @click="toProject(item.id)"
            >
                <div class="history-card-header">
                    <div class="history-card-title" :title="item.projectName">{{ item.projectName }}</div>
                    <el-popover
                        trigger="click"
                        placement="bottom"
                    >
                        <template #reference><el-icon :size="25" color="#CBCBCB" @click.stop><MoreFilled /></el-icon></template>
                        <template #default>
                            <p style="height: 32px;">
                              <el-link :underline="false" type="info" >查看详情</el-link>
                            </p>
                            <p style="height: 32px;">
                              <el-popconfirm
                                title="确定要删除这个项目吗？"
                                @confirm="deleteProject(item.id)"
                                confirm-button-text="确定"
                                cancel-button-text="取消"
                                placement="right"
                              >
                                <template #reference>
                                  <el-link :underline="false" type="danger">删除</el-link>
                                </template>
                              </el-popconfirm>
                            </p>
                        </template>
                    </el-popover>
                </div>
                <div class="history-card-meta">
                    <div class="history-card-row">
                        <el-icon :size="18"><Clock /></el-icon>
                        <span>创建时间：{{ formatDate(item.createTime) }}</span>
                    </div>
                    <div class="history-card-row">
                        <el-icon :size="18"><InfoFilled /></el-icon>
                        <span>项目ID：{{ item.id }}</span>
                    </div>
                </div>
            </el-card>
       </div>
    </el-scrollbar> 
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Clock, InfoFilled, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { useCrackDetectionStore } from '../store/CrackDetection'
const store = useCrackDetectionStore()
const input = ref('')

const startProject = async () => {
    try {
      // 从localStorage获取token
      const authToken = localStorage.getItem('authToken')
      if (!authToken) {
        ElMessage.error('请先登录')
        return
      }
      console.log("authToken:",authToken)
      // 解析token获取用户信息
      const decoded = jwtDecode(authToken)
      console.log("user_name:",decoded.username)

      const response = await axios.post('/crackdetection/createProject', 
        {
          project_name: input.value,
          user_name: decoded.username
        },
      )
      
      if (response.data.error) {
        ElMessage.error(response.data.error)
        return
      }
      store.projectId = response.data.project_id;
      store.nextStep();
    } catch (error) {
      if (error.response?.status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        return
      }
      ElMessage.error('创建项目失败：' + (error.response?.data?.error || error.message))
      return
    }
}

const historyItems = ref([]);
const fetchProjects = async () => {
  try {
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      ElMessage.error('请先登录')
      return
    }

    const decoded = jwtDecode(authToken)
    const response = await axios.get('/crackdetection/getProject', {
      params: {
        user_name: decoded.username,
      }
    })

    if (response.data.error) {
      ElMessage.error(response.data.error)
      return
    }
    // 添加新项目到列表
    historyItems.value = response.data.projects.map(item => ({
      projectName: item.project_name,
      createTime: item.create_time,
      id: item.project_id
    }))
  } catch (error) {
    ElMessage.error('获取项目列表失败：' + error.message)
  }
}

// 删除项目
const deleteProject = async (projectId) => {
  try {
    const response = await axios.delete(`/crackdetection/deleteProject/${projectId}`)
    
    if (response.data.message) {
      ElMessage.success('项目删除成功')
      // 从列表中移除已删除的项目
      historyItems.value = historyItems.value.filter(p => p.id !== projectId)
    } else {
      throw new Error(response.data.message || '删除失败')
    }
  } catch (error) {
    console.error('Failed to delete project:', error)
    ElMessage.error('删除项目失败：' + error.message)
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  // 直接加8小时（8 * 60 * 60 * 1000 毫秒）
  const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  return beijingTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toProject = (projectId) => {
  store.projectId=projectId;
  store.nextStep();
}

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.small-title{
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 2vh;
    color: black;
}

.history-card{
    width:31%;
    min-height: 160px;
    margin-bottom: 3%;
}

.history-card-header {
    display: flex;
    align-items: flex-start;
    width: 100%;
    gap: 8px;
}

.history-card-title {
    color: black;
    font-weight: bold;
    font-size: 21px;
    line-height: 1.2;
    margin-right: auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    word-break: break-word;
}

.history-card-meta {
    width: 100%;
    margin-top: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.history-card-row {
    display: flex;
    align-items: center;
    min-width: 0;
    color: #303133;
    font-size: 15px;
    line-height: 1.4;
}

.history-card-row span {
    margin-left: 5px;
    min-width: 0;
    overflow-wrap: anywhere;
}

:deep(.el-card) {
  border-color: #ACD6FF;
  /* 如果需要同时修改边框样式 */
  border-style: solid;
  border-radius: 20px;
  border-width: 3px;
}

:deep(.el-card__body) {
  padding-right: 10%;
  padding-left: 10%;
  padding-top: 5%;
}

.flex-container{
    display: flex;
    flex-wrap: wrap;
    gap: 2%; /* 项目间距 */
    width: 100%;
    height: 100%;
}

.el-link {
  line-height: 32px;
  font-size: 16px;
  text-align: center;
  width: 100%;
}
</style>
