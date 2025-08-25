<template>
  <div class="container">
    <!-- 步骤导航 -->
    <el-steps class="stepsStyle" :active="2" finish-status="success" simple>
      <el-step title="上传图片" @click="$router.push('/crackdetect/UploadImage')" />
      <el-step title="幕墙块检测分割" @click="$router.push('/crackdetect/ObjectDetection')" />
      <el-step title="裂缝检测" />
      <el-step title="裂缝测量" />
    </el-steps>

    <div class="main-scroll">
      <el-card class="detection-card">
        <template #header>
          <div class="card-header">
            <span>裂缝检测</span>
            <el-button 
              type="primary" 
              @click="startCrackDetection"
            >
              开始检测
            </el-button>
          </div>
        </template>

        <div class="three-column-grid">
          <div class="image-container">
            <h3>分割结果</h3>
            <el-image
              :src="processedImage.transformed_image"
              fit="contain"
              class="preview-image"
              :preview-src-list="[processedImage.transformed_image]"
            />
          </div>
          <div class="image-container">
            <h3>几何变换</h3>
            <div class="detail-grid">
              <div v-for="(url, index) in processedImage.detail_images" :key="index" class="detail-item">
                <el-image
                  :src="url"
                  fit="contain"
                  class="detail-image"
                  :preview-src-list="[url]"
                />
                <span class="detail-label">区域 {{ index + 1 }}</span>
              </div>
            </div>
          </div>
          <div class="image-container">
            <h3>Segformer模型</h3>
            <div v-if="crackResult" class="detail-grid">
              <div v-for="(result, index) in crackResult" :key="index" class="detail-item">
                <el-image
                  :src="result.url"
                  fit="contain"
                  class="detail-image"
                  :preview-src-list="[result.url]"
                />
                <div class="result-info">
                  <span class="detail-label">区域 {{ index + 1 }}</span>
                  <el-tag :type="result.have_crack ? 'danger' : 'success'">
                    {{ result.have_crack ? '有裂缝' : '无裂缝' }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div v-else class="detail-grid">
              <div v-for="(_, index) in processedImage.detail_images" :key="index" class="detail-item">
                <div class="no-result">
                  <span>等待检测</span>
                </div>
                <span class="detail-label">区域 {{ index + 1 }}</span>
              </div>
            </div>
          </div>
          <div class="image-container">
            <h3>CrackDetection模型</h3>
            <div v-if="crackResult2" class="detail-grid">
              <div v-for="(result, index) in crackResult2" :key="index" class="detail-item">
                <el-image
                  :src="result.url"
                  fit="contain"
                  class="detail-image"
                  :preview-src-list="[result.url]"
                />
                <div class="result-info">
                  <span class="detail-label">区域 {{ index + 1 }}</span>
                </div>
              </div>
            </div>
            <div v-else class="detail-grid">
              <div v-for="(_, index) in processedImage.detail_images" :key="index" class="detail-item">
                <div class="no-result">
                  <span>等待检测</span>
                </div>
                <span class="detail-label">区域 {{ index + 1 }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <div class="action-footer">
        <el-button 
          type="primary" 
          @click="finishDetection"
          :disabled="!crackResult"
        >
          返回继续检测
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const processedImage = ref({
  transformed_image: '',
  detail_images: [],
  original_image: '',
  image_id: '',
  segoverview_id: ''
})
const crackResult = ref(null)
const crackResult2 = ref(null)

const startCrackDetection = async () => {
  try {
    if (!processedImage.value.segoverview_id) {
      throw new Error('缺少 segoverview_id')
    }

    // 初始化结果数组
    crackResult.value = []
    crackResult2.value = []
    let allDetectionSuccess = true

    // 对每个几何变换的图片进行检测
    for (const url of processedImage.value.detail_images) {
      // 先上传几何变换图片作为 segimage
      let seg_id
      try {
        const segImageResponse = await axios.post('/crackdetection/addSegImage', {
          segoverview_id: processedImage.value.segoverview_id,
          image_path: url
        })
        
        console.log('SegImage Response:', segImageResponse.data)
        
        if (!segImageResponse.data.seg_id) {
          console.error('Failed to add segment image:', segImageResponse.data)
          allDetectionSuccess = false
          continue
        }
        seg_id = segImageResponse.data.seg_id
      } catch (error) {
        console.error('Error adding segment image:', error)
        allDetectionSuccess = false
        continue
      }

      try {
        const [response1, response2] = await Promise.all([
          axios.post('/crackdetection/segformer/predict', {
            url: url
          }),
          axios.post('/crackdetection/crack-detection/detect', {
            url: url
          })
        ])

        if (response1.data.success && response2.data.success) {
          // 添加第一个模型的检测结果
          crackResult.value.push({
            url: response1.data.data,
            have_crack: response1.data.have_crack
          })
          
          // 添加第二个模型的检测结果（只使用 mask_url）
          crackResult2.value.push({
            url: response2.data.data.mask_url
          })

          // 上传两个模型的检测结果
          try {
            // 上传第一个模型的检测结果
            await axios.post('/crackdetection/addCrackImage', {
              seg_id: seg_id,
              image_path: response1.data.data
            })
            
            // 上传第二个模型的检测结果
            await axios.post('/crackdetection/addCrackImage', {
              seg_id: seg_id,
              image_path: response2.data.data.mask_url
            })
          } catch (error) {
            console.error('Error uploading crack detection results:', error)
          }
        } else {
          throw new Error(`裂缝检测失败: ${url}`)
        }
      } catch (error) {
        allDetectionSuccess = false
        console.error('Detection failed:', error)
      }
    }

    // 所有检测完成后，更新状态
    if (allDetectionSuccess && crackResult.value.length > 0) {
      processedImage.value.detected = true
      // 检查是否有裂缝
      const hasCrack = crackResult.value.some(result => result.have_crack)
      try {
        // 上传检测状态
        await axios.post('/crackdetection/update_image', {
          image_id: processedImage.value.image_id,
          have_crack: hasCrack ? "1" : "0",
          status: "processed"
        })
      } catch (error) {
        console.error('Error updating image status:', error)
      }
    }
  } catch (error) {
    ElMessage.error('检测失败：' + error.message)
  }
}

// 修改检查待处理图片的函数
const checkPendingImages = async (projectId) => {
  try {
    const response = await axios.get(`/crackdetection/getPendingImages/${projectId}`)
    // 如果返回的是数组，说明有待处理的图片
    if (Array.isArray(response.data)) {
      return response.data.length > 0
    }
    // 如果返回的是包含 message 的对象，说明没有待处理的图片
    if (response.data.message === "No pending images found") {
      return false
    }
    // 其他情况可能是错误
    throw new Error('获取待处理图片失败')
  } catch (error) {
    console.error('Failed to check pending images:', error)
    throw error
  }
}

// 修改 finishDetection 函数
const finishDetection = async () => {
  try {
    // 检查是否有裂缝
    const hasCrack = crackResult.value.some(result => result.have_crack)

    // 上传检测状态
    await axios.post('/crackdetection/update_image', {
      image_id: processedImage.value.image_id,
      have_crack: hasCrack ? "1" : "0",
      status: "processed"
    })

    // 从 URL 中获取 project_id
    const urlParams = new URLSearchParams(window.location.search)
    const projectId = urlParams.get('project_id')

    // 检查是否还有未处理的图片
    const hasPendingImages = await checkPendingImages(projectId)

    if (hasPendingImages) {
      // 如果还有未处理的图片，继续检测
      router.push({
        path: '/crackdetect/ObjectDetection',
        query: {
          project_id: projectId
        }
      })
    } else {
      // 如果没有未处理的图片，直接跳转到项目详情页面
      ElMessage.success('所有图片已处理完成，正在跳转到项目详情页面')
      router.push({
        path: '/crackdetect/ProjectDetail',
        query: {
          project_id: projectId
        }
      })
    }
  } catch (error) {
    console.error('Error in finishDetection:', error)
    ElMessage.error('更新检测状态失败：' + error.message)
  }
}

onMounted(() => {
  try {
    const imagesData = JSON.parse(route.query.images || '[]')[0]
    processedImage.value = {
      ...imagesData,
      detected: false  // 确保初始状态为未检测
    }
    console.log('Received segoverview_id:', processedImage.value.segoverview_id)

    // 从 URL 获取 project_id 并保存到 query 中
    const urlParams = new URLSearchParams(window.location.search)
    const projectId = urlParams.get('project_id')
    if (projectId) {
      route.query.project_id = projectId
    }
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
  height: 100vh;
  overflow-y: auto;
}

.main-scroll {
  flex: 1;
  margin-top: 20px;
}

.image-list {
  background-color: #FFFFFF;
  border: 1px solid #E4E7ED;
  border-radius: 4px;
}

/* ... 其他样式与 ObjectDetection.vue 相同 ... */

.three-column-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 20px;
  padding: 10px;
}

.image-container {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-image {
  width: 100%;
  height: 400px;
  object-fit: contain;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.detail-image {
  width: 100%;
  height: 250px;
  object-fit: contain;
  border: 1px solid #E4E7ED;
  border-radius: 4px;
}

.no-result {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F5F7FA;
  border-radius: 4px;
  color: #606266;
  width: 100%;
}

.detection-card {
  height: auto;
  margin-bottom: 20px;
}

.action-footer {
  margin-bottom: 20px;
}

.result-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px;
  margin-top: 4px;
}

.detail-label {
  font-size: 13px;
  color: #606266;
}
</style>