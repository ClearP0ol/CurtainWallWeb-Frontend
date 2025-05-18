<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <!-- 提示卡片 -->
      <div class="info-card">
        <el-card shadow="hover" class="box-card">
          <template #header>
            <span class="card-header-title">操作提示</span>
          </template>
          <ul class="card-list">
            <li>旋转模型：鼠标左键</li>
            <li>拖动模型：Ctrl + 鼠标左键</li>
            <li>点击任意位置查看图片：Shift + 鼠标左键</li>
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
            <div class="filter-tip">
              <el-alert
                title="仅展示存在的异常类型"
                type="info"
                :closable="false"
                size="small"
                effect="light"
              />
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
        <div id="threejs-container" class="threejs-container"></div>
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
            :style="{ borderColor: image.borderColor }"
          >
            <div class="card-content">
              <!-- 使用v-show而非v-if确保图片预加载 -->
              <img 
                v-show="!image.loading" 
                :src="image.imagePath" 
                class="image-card-img" 
                @load="image.loading = false"
              />
              <!-- 图片加载中显示进度圈 -->
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
                icon="el-icon-close"
                size="small"
                class="close-btn"
                @click="removeImage(index)"
                style="position: absolute; top: 10px; right: 10px;"
              />
              <!-- 显示异常类型 -->
              <div class="abnormal-type-tag" v-if="image.abnormalType">
                <el-tag size="small" type="danger">{{ image.abnormalType }}</el-tag>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图片弹窗 -->
    <el-dialog v-model="dialogVisible" title="位置图片" width="30%">
      <div class="dialog-container">
        <!-- 弹窗中图片加载条件显示 -->
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
        <!-- 使用v-show而非v-if确保图片预加载 -->
        <img 
          v-show="!imageLoading"
          :src="currentImage" 
          class="dialog-image"
          @load="imageLoading = false"
        />
        <!-- 显示异常信息 -->
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

// 配置基础请求地址
axios.defaults.baseURL = 'http://110.42.214.164:8004'

// 添加图片加载状态和进度变量
const imageLoading = ref(false)
const dialogLoadingProgress = ref(0)

let model, controls, camera, scene, renderer
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

const showRedPoints = ref(false)
const imageCards = ref([])
const redPoints = ref([])
const orangeMarkers = ref([])
const imageCoordinates = ref([])
const dialogVisible = ref(false)
const currentImage = ref('')
const isRendering = ref(true)
const currentAbnormalDetails = ref([])

// 异常类型过滤相关
const abnormalTypes = ref([])
const selectedAbnormalTypes = ref([])
const allTypesSelected = computed(() => {
  return abnormalTypes.value.length > 0 && 
         selectedAbnormalTypes.value.length === abnormalTypes.value.length
})

// 全选/取消全选异常类型
const selectAllTypes = () => {
  if (allTypesSelected.value) {
    selectedAbnormalTypes.value = []
  } else {
    selectedAbnormalTypes.value = [...abnormalTypes.value]
  }
  updateVisiblePoints()
}

// 创建一个用于跟踪图片下载进度的函数
const trackImageDownload = async (imageUrl, progressRef) => {
  // 重置进度
  progressRef.value = 0
  
  try {
    // 使用fetch API和响应的clone来跟踪下载进度
    const response = await fetch(imageUrl, {
      method: 'GET',
      cache: 'no-cache',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    // 获取内容的总长度
    const contentLength = response.headers.get('content-length')
    const total = parseInt(contentLength, 10) || 0
    
    // 复制响应流以便读取进度
    const reader = response.clone().body.getReader()
    let loaded = 0
    
    // 循环读取数据块并更新进度
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
        // 如果没有content-length，使用间隔进度更新
        progressRef.value = Math.min(progressRef.value + 10, 95)
      }
    }
    
    // 返回blob URL以便显示图片
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error downloading image:', error)
    progressRef.value = 0
    return null
  }
}

// 更新显示的红点，基于选择的异常类型
const updateVisiblePoints = () => {
  if (!showRedPoints.value) return
  
  redPoints.value.forEach(dot => {
    // 如果没有选择任何类型，则默认全部隐藏
    if (selectedAbnormalTypes.value.length === 0) {
      dot.visible = false
      return
    }
    
    // 检查该点关联的异常类型是否被选中
    const imageData = dot.userData.imageData
    if (!imageData || !imageData.abnormalDetailList) {
      dot.visible = false
      return
    }
    
    // 如果该点的任何一个异常类型在选中列表中，则显示该点
    const hasSelectedType = imageData.abnormalDetailList.some(detail => 
      selectedAbnormalTypes.value.includes(detail.typeName)
    )
    
    dot.visible = hasSelectedType
  })
  
  renderer.render(scene, camera)
}

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

// 创建红点标记
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
      imageData: coord // 存储完整的图片数据
    }
    scene.add(dot)
    redPoints.value.push(dot)
  })
  
  // 根据选择的异常类型更新可见性
  updateVisiblePoints()
}

const onPointerClick = async (event) => {
  const container = document.getElementById('threejs-container')
  const rect = container.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1
  raycaster.setFromCamera(pointer, camera)

  // 如果处于显示红点（异常图片）模式
  if (showRedPoints.value) {
    const hits = raycaster.intersectObjects(redPoints.value)
    if (hits.length) {
      const dot = hits[0].object
      if (!dot.userData.clicked && imageCards.value.length < 5) {
        dot.userData.clicked = true
        const imageData = dot.userData.imageData
        
        try {
          // 获取图片URL
          const urlResp = await axios.get(`/imageData/${imageData.imageId}/url`)
          const imageUrl = urlResp.data.data
          
          if (!imageUrl) {
            throw new Error('No image URL')
          }
          
          // 找出该图片的第一个异常类型（用于显示标签）
          let abnormalType = null
          if (imageData.abnormalDetailList && imageData.abnormalDetailList.length > 0) {
            abnormalType = imageData.abnormalDetailList[0].typeName
          }
          
          // 先添加一个带加载状态的卡片
          const newCard = {
            imageId: imageData.imageId,
            imagePath: '', // 暂时为空，等下载完成后更新
            borderColor: '#FF0000',
            loading: true,
            loadingProgress: 0,
            abnormalType: abnormalType
          }
          
          imageCards.value.push(newCard)
          const cardIndex = imageCards.value.length - 1
          
          // 创建一个新的进度引用
          const progressRef = ref(0)
          
          // 绑定进度引用到卡片
          Object.defineProperty(newCard, 'loadingProgress', {
            get: () => progressRef.value,
            set: (val) => { progressRef.value = val }
          })
          
          // 开始跟踪图片下载进度
          const blobUrl = await trackImageDownload(imageUrl, progressRef)
          
          if (blobUrl) {
            // 更新卡片信息
            imageCards.value[cardIndex] = {
              ...newCard,
              imagePath: blobUrl,
              loading: false,
              loadingProgress: 100
            }
          } else {
            // 下载失败，移除卡片
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
    return // ✅ 直接 return，忽略后续模型点击逻辑
  }

  // 普通模式下（红点未开启），可以 Shift+点击模型获取图片
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
        // 显示弹窗并重置加载状态
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
          
          if (!imageUrl) {
            throw new Error('No image URL')
          }
          
          // 保存异常详情以便在弹窗中显示
          currentAbnormalDetails.value = d.abnormalDetailList || []
          
          // 跟踪图片下载进度
          const blobUrl = await trackImageDownload(imageUrl, dialogLoadingProgress)
          
          if (blobUrl) {
            currentImage.value = blobUrl
            // 进度值已经在 trackImageDownload 中更新为 100
            // 图片加载完成后会触发 @load 事件，将 imageLoading 设置为 false
          } else {
            throw new Error('Image download failed')
          }
        } else {
          throw new Error('no data')
        }
      } catch (error) {
        console.error('Error:', error)
        // 关闭进度条和弹窗
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
  try {
    await axios.delete(`/imageData/${img.imageId}`)
  } catch {}
  if (showRedPoints.value) {
    const dp = redPoints.value.find(d => d.userData.imageId === img.imageId)
    if (dp) { dp.userData.clicked = false }
  } else {
    const mk = orangeMarkers.value[idx]
    if (mk) scene.remove(mk)
    orangeMarkers.value.splice(idx, 1)
  }
  imageCards.value.splice(idx, 1)
}

// 提取并存储所有异常类型
const extractAbnormalTypes = () => {
  const types = new Set()
  
  imageCoordinates.value.forEach(coord => {
    if (coord.abnormalDetailList && coord.abnormalDetailList.length > 0) {
      coord.abnormalDetailList.forEach(detail => {
        if (detail.typeName) {
          types.add(detail.typeName)
        }
      })
    }
  })
  
  abnormalTypes.value = Array.from(types).sort()
  selectedAbnormalTypes.value = [...abnormalTypes.value] // 默认全选
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
    '同济大学地震馆gltf/SampleScene.gltf',
    gltf => {
      model = gltf.scene
      model.traverse(c => {
        if (c.isMesh) {
          c.material.metalness = 0.2
          c.material.roughness = 0.8
        }
      })
      scene.add(model)
    },
    undefined,
    e => console.error('模型加载失败', e)
  )

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
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
      
      // 提取所有异常类型
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
/* 所有样式与你原来的保持一致 */
.model-container {
  width: 65%;
  height: 70vh;
  margin: 20px auto;
  position: relative;
}

.threejs-container {
  width: 100%;
  height: 100%;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: linear-gradient(145deg, #f5f5f5, #ffffff);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.image-container {
  position: fixed;
  bottom: 20px;
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
  top: 100px;
  left: 20px;
  z-index: 1000;
}
.additional-card {
  position: absolute;
  top: 400px;
  left: 20px;
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

/* 新增加载样式 */
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

/* 新增筛选样式 */
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
</style>