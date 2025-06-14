<template>
  <UDashboardPage>
    <!-- 顶部右上角跳转按钮 -->
    <div class="top-right-button">
      <el-button 
        type="danger" 
        icon="i-heroicons-home"
        @click="exitAndGoHome"
        size="big"
        round
        style="width: 100%;justify-content: center;"
      >
        退出并返回首页
      </el-button>
      <div class="button-hint">退出本页面请点击此按钮</div>
    </div>
    <UDashboardPanel grow>
      <!-- 提示卡片 -->
      <div class="info-card">
        <el-card shadow="hover" class="box-card">
          <template #header>
            <span class="card-header-title">操作提示</span>
          </template>
          <ul class="card-list">
            <li>旋转模型：<kbd>🖱️ 左键</kbd></li>
            <li>拖动模型：</li>
            <li><kbd>Ctrl</kbd> + <kbd>🖱️ 左键</kbd></li>
            <li>点击查看图片：</li>
            <li><kbd>Shift</kbd> + <kbd>🖱️ 左键</kbd></li>
            <li>缩放模型：<kbd>🖱️ 中键</kbd></li>
          </ul>
        </el-card>
      </div>

      <!-- "其他功能"卡片 -->
      <div class="additional-card">
        <el-card shadow="hover" class="box-card">
          <template #header>
            <el-button
              :type="showRedPoints ? 'danger' : 'primary'"
              @click="toggleRedPoints"
              size="small"
              style="width: 100%;"
            >
              {{ showRedPoints ? '隐藏异常图片' : '显示异常图片' }}
            </el-button>
          </template>
          
          <!-- 异常类型选择 -->
          <div v-if="showRedPoints" class="filter-container">
            <div class="filter-header">
              <span class="filter-title">异常类型筛选</span>
              <el-button 
                type="text" 
                size="small" 
                @click="selectAllTypes"
                style="margin-left: auto;"
              >
                {{ allTypesSelected ? '取消全选' : '全选' }}
              </el-button>
            </div>
            <el-checkbox-group v-model="selectedAbnormalTypes" @change="updateVisiblePoints">
              <el-checkbox 
                v-for="type in abnormalTypes" 
                :key="type" 
                :label="type"
                class="checkbox-item"
              >
                {{ type }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-card>
      </div>

      <!-- 3D 模型容器 -->
       <div class="model-container">
        <el-divider content-position="center">3D 模型展示</el-divider>
        <div id="threejs-container" class="threejs-container">
          <!-- 模型加载进度提示层 -->
          <div v-if="modelLoading" class="model-loading-overlay">
            <el-progress
              :percentage="modelLoadingProgress"
              type="circle"
              :width="100"
              :stroke-width="6"
              status="success"
            />
            <div class="progress-text">{{ modelLoadingProgress }}%</div>
          </div>
        </div>
      </div>

    </UDashboardPanel>

    <!-- 图片展示区域 -->
    <div class="image-container">
      <el-row :gutter="20">
        <el-col :span="4" v-for="(image, index) in imageCards" :key="image.imageId">
          <el-card
            :body-style="{ padding: '0px' }"
            class="card"
            shadow="hover"
            :style="{ borderColor: '#FF0000' }"
          >
            <div class="card-content">
              <img 
                v-show="!image.loading" 
                :src="image.imagePath" 
                class="image-card-img" 
                @load="image.loading = false"
                @click="showImageDialog(image)"
              />
              <div v-if="image.loading" class="loading-container">
                <el-progress 
                  type="circle" 
                  :percentage="image.loadingProgress" 
                  :width="80"
                  :stroke-width="6"
                  status="success"
                ></el-progress>
                <div class="progress-text">{{image.loadingProgress}}%</div>
              </div>
                <el-button
                  type="danger"
                  size="small"
                  class="close-btn"
                  @click="removeImage(index)"
                  style="position: absolute; top: 10px; right: 10px;"
                >
                  ❌
                </el-button>
              <div class="abnormal-type-tag" v-if="image.abnormalType">
                <el-tag size="small" type="danger">{{ image.abnormalType }}</el-tag>
              </div>
              <div 
                class="photo-sequence-label" 
                :style="{ 
                  backgroundColor: image.dotColor,
                  color: getContrastColor(image.dotColor) 
                }"
              >
                {{ image.sequenceNumber }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

<!-- 图片弹窗 -->
<el-dialog 
  v-model="dialogVisible" 
  title="图片详情" 
  width="80%"
  :show-close="false"
  @click="dialogVisible = false"
  custom-class="image-preview-dialog"
>
  <div class="dialog-container">
    <div v-if="imageLoading" class="dialog-loading-container">
      <el-progress 
        type="circle" 
        :percentage="dialogLoadingProgress" 
        :width="100"
        :stroke-width="6"
        status="success"
      ></el-progress>
      <div class="progress-text">{{dialogLoadingProgress}}%</div>
    </div>
    <img 
      v-show="!imageLoading"
      :src="currentImage" 
      class="dialog-image"
      @load="imageLoading = false"
    />
    <div v-if="currentAbnormalDetails?.length" class="abnormal-details">
      <el-divider content-position="center">异常信息</el-divider>
      <div v-for="(detail, index) in currentAbnormalDetails" :key="index" class="abnormal-detail-item">
        <el-tag size="small" type="danger">{{ detail.typeName }}</el-tag>
        <span v-if="detail.description" class="detail-description">{{ detail.description }}</span>
      </div>
    </div>
  </div>
</el-dialog>
  </UDashboardPage>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useRouter } from 'vue-router'

// 配置基础请求地址
axios.defaults.baseURL = 'http://110.42.214.164:8004'

// 颜色序列
const colorSequence = [
  '#006D5B', // Dark Teal
  '#008080', // Teal
  '#4CABA6', // Medium Teal
  '#7AC5CD', // Light Teal
  '#B2DFDB', // Pale Teal
  '#E0F2F1'  // Very Pale Teal
]

// 状态变量
const imageLoading = ref(false)
const dialogLoadingProgress = ref(0)
const modelLoading = ref(true)
const modelLoadingProgress = ref(0)
const showRedPoints = ref(false)
const imageCards = ref([])
const redPoints = ref([])
const orangeMarkers = ref([])
const imageCoordinates = ref([])
const dialogVisible = ref(false)
const currentImage = ref('')
const isRendering = ref(true)
const currentAbnormalDetails = ref([])
const usedColors = ref([])
const abnormalTypes = ref([])
const selectedAbnormalTypes = ref([])

const router = useRouter()
let model, controls, camera, scene, renderer
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

// 计算对比色
const getContrastColor = (hexColor) => {
  if (!hexColor) return '#ffffff'
  const r = parseInt(hexColor.substr(1, 2), 16)
  const g = parseInt(hexColor.substr(3, 2), 16)
  const b = parseInt(hexColor.substr(5, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

// 获取下一个可用颜色
const getNextAvailableColor = () => {
  for (const color of colorSequence) {
    if (!usedColors.value.includes(color)) {
      return color
    }
  }
  usedColors.value = []
  return colorSequence[0]
}

const exitAndGoHome = () => {
  isRendering.value = false
  try {
    const container = document.getElementById('threejs-container')
    container?.removeEventListener('click', onPointerClick)
    scene?.clear()
    renderer?.dispose()
  } catch (e) {
    console.warn('资源清理失败：', e)
  }
  router.push('/')
}

// 异常类型过滤相关
const allTypesSelected = computed(() => {
  return abnormalTypes.value.length > 0 && 
         selectedAbnormalTypes.value.length === abnormalTypes.value.length
})

const selectAllTypes = () => {
  if (allTypesSelected.value) {
    selectedAbnormalTypes.value = []
  } else {
    selectedAbnormalTypes.value = [...abnormalTypes.value]
  }
  updateVisiblePoints()
}

const trackImageDownload = async (imageUrl, progressRef) => {
  progressRef.value = 0
  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      cache: 'no-cache',
    })
    
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
    
    const contentLength = response.headers.get('content-length')
    const total = parseInt(contentLength, 10) || 0
    const reader = response.clone().body.getReader()
    let loaded = 0
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        progressRef.value = 100
        break
      }
      loaded += value.length
      if (total) {
        progressRef.value = Math.min(Math.round((loaded / total) * 100), 100)
      } else {
        progressRef.value = Math.min(progressRef.value + 10, 95)
      }
    }
    
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error downloading image:', error)
    progressRef.value = 0
    return null
  }
}

const updateVisiblePoints = () => {
  if (!showRedPoints.value) return
  
  redPoints.value.forEach(dot => {
    if (selectedAbnormalTypes.value.length === 0) {
      dot.visible = false
      return
    }
    
    const imageData = dot.userData.imageData
    if (!imageData || !imageData.abnormalDetailList) {
      dot.visible = false
      return
    }
    
    const hasSelectedType = imageData.abnormalDetailList.some(detail => 
      selectedAbnormalTypes.value.includes(detail.typeName)
    )
    
    dot.visible = hasSelectedType
  })
  
  renderer.render(scene, camera)
}

const showImageDialog = (image) => {
  currentImage.value = image.imagePath;
  dialogVisible.value = true;
};

const toggleRedPoints = () => {
  showRedPoints.value = !showRedPoints.value

  if (showRedPoints.value) {
    orangeMarkers.value.forEach(m => m.visible = false)
    if (redPoints.value.length === 0) {
      createRedPoints()
    } else {
      updateVisiblePoints()
    }
  } else {
    redPoints.value.forEach(dot => dot.visible = false)
    orangeMarkers.value.forEach(m => m.visible = true)
  }

  renderer.render(scene, camera)
}

const createRedPoints = () => {
  imageCoordinates.value.forEach(coord => {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )
    dot.position.set(-coord.centerX, coord.centerY, coord.centerZ)
    dot.userData = { 
      clicked: false,
      imageId: coord.imageId,
      imageData: coord
    }
    scene.add(dot)
    redPoints.value.push(dot)
  })
  updateVisiblePoints()
}

const onPointerClick = async (event) => {
  const container = document.getElementById('threejs-container')
  const rect = container.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1
  raycaster.setFromCamera(pointer, camera)

  if (showRedPoints.value) {
    const hits = raycaster.intersectObjects(redPoints.value)
    if (hits.length) {
      const dot = hits[0].object
      
      if (!dot.userData.clicked && imageCards.value.length >= 6) {
        ElMessage.warning('照片框容量达到上限（6张），请删除一些图片后再进行查看')
        return
      }
      
      if (!dot.userData.clicked && imageCards.value.length < 6) {
        dot.userData.clicked = true
        const nextColor = getNextAvailableColor()
        usedColors.value.push(nextColor)
        dot.material.color.set(new THREE.Color(nextColor))
        
        const imageData = dot.userData.imageData
        
        try {
          const urlResp = await axios.get(`/imageData/${imageData.imageId}/url`)
          const imageUrl = urlResp.data.data
          
          if (!imageUrl) throw new Error('No image URL')
          
          let abnormalType = null
          if (imageData.abnormalDetailList && imageData.abnormalDetailList.length > 0) {
            abnormalType = imageData.abnormalDetailList[0].typeName
          }

          const newCard = {
            imageId: imageData.imageId,
            imagePath: '',
            loading: true,
            loadingProgress: 0,
            abnormalType: abnormalType,
            sequenceNumber: imageCards.value.length + 1,
            dotColor: nextColor
          }
          
          imageCards.value.push(newCard)
          const cardIndex = imageCards.value.length - 1
          
          const progressRef = ref(0)
          Object.defineProperty(newCard, 'loadingProgress', {
            get: () => progressRef.value,
            set: (val) => { progressRef.value = val }
          })
          
          const blobUrl = await trackImageDownload(imageUrl, progressRef)
          
          if (blobUrl) {
            imageCards.value[cardIndex] = {
              ...newCard,
              imagePath: blobUrl,
              loading: false,
              loadingProgress: 100
            }
          } else {
            imageCards.value.splice(cardIndex, 1)
            dot.userData.clicked = false
            ElMessage.error('图片加载失败')
          }
        } catch (error) {
          console.error('Error:', error)
          dot.userData.clicked = false
          ElMessage.error('获取图片信息失败')
        }
      }
    }
    return
  }

  if (event.shiftKey) {
    const hits = raycaster.intersectObjects(model?.children || [], true)
    if (hits.length) {
      const p = hits[0].point
      const mk = new THREE.Mesh(
        new THREE.SphereGeometry(0.3),
        new THREE.MeshBasicMaterial({ color: 0xFFA500, transparent: true, opacity: 0.8 })
      )
      mk.position.copy(p)
      scene.add(mk)
      orangeMarkers.value.push(mk)

      try {
        dialogVisible.value = true
        imageLoading.value = true
        dialogLoadingProgress.value = 0
        
        const resp = await axios.get('/imageData/closest', {
          params: {
            clickX: (-p.x).toFixed(2),
            clickY: p.y.toFixed(2),
            clickZ: p.z.toFixed(2)
          }
        })
        
        if (resp.data.code === 200 && resp.data.data) {
          const d = resp.data.data
          const urlResp = await axios.get(`/imageData/${d.imageId}/url`)
          const imageUrl = urlResp.data.data
          
          if (!imageUrl) throw new Error('No image URL')
          
          currentAbnormalDetails.value = d.abnormalDetailList || []
          const blobUrl = await trackImageDownload(imageUrl, dialogLoadingProgress)
          
          if (blobUrl) {
            currentImage.value = blobUrl
          } else {
            throw new Error('Image download failed')
          }
        } else {
          throw new Error('no data')
        }
      } catch (error) {
        console.error('Error:', error)
        imageLoading.value = false
        dialogVisible.value = false
        ElMessage.warning('当前位置暂无匹配图片')
        scene.remove(mk)
        orangeMarkers.value.pop()
      }
    }
  }
}

const removeImage = async (idx) => {
  const img = imageCards.value[idx]
  if (img.dotColor) {
    usedColors.value = usedColors.value.filter(c => c !== img.dotColor)
  }
  
  try {
    await axios.delete(`/imageData/${img.imageId}`)
  } catch {}
  
  if (showRedPoints.value) {
    const dp = redPoints.value.find(d => d.userData.imageId === img.imageId)
    if (dp) {
      dp.userData.clicked = false
      dp.material.color.set(0xff0000)
    }
  } else {
    const mk = orangeMarkers.value[idx]
    if (mk) scene.remove(mk)
    orangeMarkers.value.splice(idx, 1)
  }
  
  imageCards.value.splice(idx, 1)
  imageCards.value.forEach((card, index) => {
    card.sequenceNumber = index + 1
  })
}

const extractAbnormalTypes = () => {
  const types = new Set()
  imageCoordinates.value.forEach(coord => {
    if (coord.abnormalDetailList && coord.abnormalDetailList.length > 0) {
      coord.abnormalDetailList.forEach(detail => {
        if (detail.typeName) types.add(detail.typeName)
      })
    }
  })
  abnormalTypes.value = Array.from(types).sort()
  selectedAbnormalTypes.value = [...abnormalTypes.value]
}

onMounted(() => {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  const container = document.getElementById('threejs-container')
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 1.5))
  const dl = new THREE.DirectionalLight(0xffffff, 2)
  dl.position.set(5, 5, 5)
  scene.add(dl)

  new GLTFLoader().load(
    'Model/SampleScene.gltf',
    gltf => {
      model = gltf.scene
      model.traverse(c => {
        if (c.isMesh) {
          c.material.metalness = 0.2
          c.material.roughness = 0.8
        }
      })
      scene.add(model)
      modelLoading.value = false
    },
    xhr => {
      if (xhr.lengthComputable) {
        modelLoadingProgress.value = Math.round((xhr.loaded / xhr.total) * 100)
      }
    },
    e => {
      console.error('模型加载失败', e)
      modelLoading.value = false
    }
  )

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
  }

  const dom = renderer.domElement
  dom.addEventListener('pointerdown', e => {
    if (e.button === 0) {
      controls.mouseButtons.LEFT = e.ctrlKey
        ? THREE.MOUSE.PAN
        : THREE.MOUSE.ROTATE
    }
  })
  dom.addEventListener('pointerup', () => {
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
  })

  camera.position.set(0, 5, 10)
  camera.lookAt(0, 0, 0)

  const animate = () => {
    if (isRendering.value) {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
  }
  animate()

  axios.get('/imageData/all-abnormal-images')
    .then(res => {
      imageCoordinates.value = res.data.data.map(d => ({
        imageId: d.imageId,
        centerX: d.centerX,
        centerY: d.centerY,
        centerZ: d.centerZ,
        abnormalDetailList: d.abnormalDetailList || []
      }))
      extractAbnormalTypes()
    })
    .catch(() => {
      ElMessage.error('加载异常坐标失败')
    })

  container.addEventListener('click', onPointerClick)
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  })
})

onUnmounted(() => {
  isRendering.value = false
  const c = document.getElementById('threejs-container')
  c.removeEventListener('click', onPointerClick)
  scene.clear()
  renderer.dispose()
})
</script>

<style scoped>
.model-container {
  width: 65%;
  height: 65vh;
  margin: 20px auto;
  position: relative;
}

.threejs-container {
  width: 100%;
  height: 100%;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: linear-gradient(145deg, #f5f5f5, #ffffff);
}

.image-container {
  position: absolute;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  padding: 15px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.card {
  transition: all 0.3s;
  border: 2px solid transparent;
}
.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}
.image-card-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 4px;
}
.dialog-image {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.close-btn {
  transition: all 0.2s ease;
}
.close-btn:hover {
  transform: scale(1.1);
  background-color: rgba(255, 0, 0, 0.8) !important;
}

.info-card {
  position: absolute;
  top: 8%;
  left: 2%;
  z-index: 1000;
}
.additional-card {
  position: absolute;
  top:43%;
  left: 2%;
  z-index: 1000;
}

.box-card {
  width: 200px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.card-header-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
.card-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.card-list li {
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.loading-container {
  width: 100%;
  height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f7f8fa;
  border-radius: 4px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.dialog-container {
  position: relative;
  width: 100%;
  min-height: 300px;
}

.dialog-loading-container {
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f7f8fa;
  border-radius: 8px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.progress-text {
  margin-top: 10px;
  font-size: 14px;
  color: #409EFF;
  font-weight: bold;
}

.card-content {
  position: relative;
  width: 100%;
  height: 180px;
}

.filter-container {
  margin-top: 10px;
}

.filter-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.filter-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

.filter-tip {
  margin: 8px 0;
}

.checkbox-item {
  display: block;
  margin-bottom: 6px;
}

.abnormal-type-tag {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 2;
}

.abnormal-details {
  margin-top: 15px;
}

.abnormal-detail-item {
  margin: 8px 0;
  display: flex;
  align-items: center;
}

.detail-description {
  margin-left: 8px;
  font-size: 14px;
  color: #606266;
}
.model-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.92);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}
.card-list kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 12px;
  font-family: monospace;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.top-right-button {
  position: absolute;
  top: 8%;
  right: 6%;
  z-index: 2;
  width: 120px;
}
.photo-sequence-label {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 13px;
  z-index: 2;
  border-radius: 50%;
  text-shadow: 0 1px 1px rgba(0,0,0,0.3);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
/* 弹窗样式 */
.image-preview-dialog {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-image {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  cursor: pointer;
  display: block;
  margin: 0 auto;
}

.dialog-container {
  position: relative;
  width: 100%;
  min-height: 300px;
  text-align: center;
}
.button-hint {
  margin-top: 8px;
  font-size: 18px;
  color: #9f0b0b;
  text-align: center;
  line-height: 1.4;
}
</style>