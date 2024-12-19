<template>
  <div class="container">
    <el-card class="project-card">
      <div class="project-header">
        <el-icon class="logo" :size="60" color="#B29F82">
          <Monitor />
        </el-icon>
        <h1>幕墙裂缝检测系统</h1>
      </div>

      <el-form 
        :model="projectForm"
        :rules="rules"
        ref="projectFormRef"
        label-position="top"
        class="project-form"
      >
        <el-form-item 
          label="项目名称" 
          prop="projectName"
          :rules="[
            { required: true, message: '请输入项目名称', trigger: 'blur' },
            { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
          ]"
        >
          <el-input 
            v-model="projectForm.projectName"
            placeholder="请输入项目名称"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="startProject"
            :loading="loading"
            class="start-button"
          >
            开始检测
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import jwtDecode from "jwt-decode";
import { Monitor } from '@element-plus/icons-vue'

const router = useRouter()
const projectFormRef = ref(null)
const loading = ref(false)

const projectForm = ref({
  projectName: ''
})

const project_id = ref(null)
const startProject = async () => {
  if (!projectFormRef.value) return

  try {
    await projectFormRef.value.validate()
    loading.value = true

    // 调用创建项目API
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

      const response = await axios.post('http://127.0.0.1:5000/createProject', 
        {
          project_name: projectForm.value.projectName,
          user_name: decoded.username
        },
      )
      
      if (response.data.error) {
        ElMessage.error(response.data.error)
        return
      }
      project_id.value = response.data.project_id
    } catch (error) {
      if (error.response?.status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        // 可以在这里添加重定向到登录页面的逻辑
        return
      }
      ElMessage.error('创建项目失败：' + (error.response?.data?.error || error.message))
      return
    }

    

    // 跳转到上传页面
    router.push({
      path: '/crackdetect/UploadImage',
      query: {
        projectName: projectForm.value.projectName,
        project_id: project_id.value
      }
    })

  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #F5F7FA;
}

.project-card {
  width: 100%;
  max-width: 500px;
  padding: 40px;
  background-color: #FFFDFA;
  border-radius: 8px;
  border: 1px solid #E4E7ED;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.project-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

.project-header h1 {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.project-form {
  margin-top: 30px;
}

.start-button {
  width: 100%;
  height: 40px;
  margin-top: 20px;
  background-color: #1989FA;
  border-color: #1989FA;
}

.start-button:hover {
  background-color: #409EFF;
  border-color: #409EFF;
}

:deep(.el-input__wrapper) {
  background-color: #F5F7FA;
}

:deep(.el-input__inner) {
  height: 40px;
}

:deep(.el-form-item__label) {
  color: #303133;
  font-weight: 500;
}
</style> 