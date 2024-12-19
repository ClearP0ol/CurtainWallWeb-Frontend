<template>
  <div class="container">
    <!-- 步骤导航 -->
    <el-steps class="stepsStyle" :active="1" finish-status="success" simple>
      <el-step title="上传图片" @click="$router.push('/crackdetect/UploadImage')" />
      <el-step title="幕墙块目标检测" />
      <el-step title="幕墙块分割" />
      <el-step title="裂缝检测" />
      <el-step title="裂缝测量" />
    </el-steps>

    <el-container class="main-content">
      <!-- 左侧图片列表 -->
      <el-aside width="auto">
        <el-collapse v-model="isCollapse" class="image-list">
          <el-collapse-item>
            <template #title>
              <div class="collapse-header">
                <span>图片列表</span>
                <el-badge :value="uploadedImages.length" class="image-count" />
              </div>
            </template>
            <el-scrollbar height="calc(100vh - 200px)">
              <div 
                v-for="(image, index) in uploadedImages" 
                :key="index"
                class="image-item"
                :class="{ active: currentImageIndex === index }"
                @click="selectImage(index)"
              >
                <el-image 
                  :src="image.url" 
                  fit="cover"
                  class="thumbnail"
                />
                <div class="image-info">
                  <span class="image-name">{{ image.name }}</span>
                  <el-tag 
                    :type="image.detected ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ image.detected ? '已检测' : '未检测' }}
                  </el-tag>
                </div>
              </div>
            </el-scrollbar>
          </el-collapse-item>
        </el-collapse>
      </el-aside>

      <!-- 主要内容区域 -->
      <el-main>
        <el-card class="detection-card">
          <template #header>
            <div class="card-header">
              <span>目标检测</span>
              <el-button 
                type="primary" 
                @click="startDetection"
                :disabled="!currentImage || currentImage.detected"
              >
                开始检测
              </el-button>
            </div>
          </template>

          <div class="image-comparison" v-if="currentImage">
            <div class="image-container">
              <h3>原始图片</h3>
              <el-image
                :src="currentImage.url"
                fit="contain"
                :preview-src-list="[currentImage.url]"
              />
            </div>
            <div class="image-container">
              <h3>检测结果</h3>
              <el-image
                v-if="currentImage.detectedUrl"
                :src="currentImage.detectedUrl"
                fit="contain"
                :preview-src-list="[currentImage.detectedUrl]"
              />
              <div v-else class="no-result">
                {{ currentImage.detected ? '检测完成' : '等待检测' }}
              </div>
            </div>
          </div>
          <el-empty v-else description="请选择要检测的图片" />
        </el-card>

        <div class="action-footer">
          <el-button 
            type="primary" 
            @click="nextStep"
            :disabled="!canProceed"
          >
            下一步
          </el-button>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const isCollapse = ref(['1'])
const currentImageIndex = ref(null)
const uploadedImages = ref([
  // 这里应该从上一步获取图片列表
])

const currentImage = computed(() => {
  if (currentImageIndex.value === null) return null
  return uploadedImages.value[currentImageIndex.value]
})

const canProceed = computed(() => {
  return uploadedImages.value.every(img => img.detected)
})

const selectImage = (index) => {
  currentImageIndex.value = index
}

const startDetection = async () => {
  if (!currentImage.value) return
  
  try {
    // 调用检测API
    const response = await axios.get('api/sequence/detect_boxes', {
      params: {
        source_image_path: currentImage.value.serverUrl
      }
    })

    // 更新检测结果
    if (response.data.image_obb_boxes_path !== "-1") {
      currentImage.value.detected = true
      currentImage.value.detectedUrl = response.data.image_obb_boxes_path
      currentImage.value.boxes_object_path = response.data.boxes_object_path
    }
  } catch (error) {
    ElMessage.error('检测失败：' + error.message)
  }
}

const nextStep = () => {
  const response = uploadedImages.value.map(img => ({
    source_image_path: img.serverUrl,
    boxes_object_path: img.boxes_object_path
  }))

  router.push({
    path: '/split',
    query: {
      response: JSON.stringify(response)
    }
  })
}

onMounted(() => {
  try {
    const imagesData = JSON.parse(route.query.images || '[]')
    uploadedImages.value = imagesData.map(img => ({
      ...img,
      detected: false,
      detectedUrl: null,
      boxes_object_path: null,
      url: img.serverUrl
    }))
  } catch (error) {
    console.error('Failed to parse images data:', error)
    ElMessage.error('加载图片数据失败')
  }
})
</script>

<style scoped>
.container {
  background-color: #F5F7FA;
  padding: 20px;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-top: 20px;
}

.image-list {
  background-color: #FFFFFF;
  border: 1px solid #E4E7ED;
  border-radius: 4px;
}

.collapse-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.image-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-item.active {
  background-color: #f0f0f0;
}

.thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 4px;
}

.image-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.image-name {
  font-size: 14px;
  color: #606266;
}

.detection-card {
  background-color: #FFFFFF;
  border: 1px solid #E4E7ED;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.image-container {
  text-align: center;
}

.no-result {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F5F7FA;
  border-radius: 4px;
  color: #606266;
}

.action-footer {
  text-align: center;
  margin-top: 20px;
}

:deep(.el-step__title) {
  white-space: nowrap;
  font-size: 14px;
}

:deep(.el-button--primary) {
  background-color: #1989FA;
  border-color: #1989FA;
}

:deep(.el-button--primary:hover) {
  background-color: #409EFF;
  border-color: #409EFF;
}
</style> 