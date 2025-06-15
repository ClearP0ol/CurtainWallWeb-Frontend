<template>
  <!-- 主仪表盘页面布局 -->
  <UDashboardPage>
    <!-- 右上角退出按钮区域 -->
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
    
    <!-- 主仪表盘面板 -->
    <UDashboardPanel grow>
      <!-- 操作提示信息卡片 -->
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

      <!-- 其他功能卡片 -->
      <div class="additional-card">
        <el-card shadow="hover" class="box-card">
          <template #header>
            <el-button
              :type="showRedPoints ? 'danger' : 'primary'"
              @click="toggleRedPoints"
              size="small"
              style="width: 100%;"
              :loading="abnormalDataLoading"
              :disabled="abnormalDataLoading"
            >
              {{ abnormalDataLoading ? '加载异常数据中...' : (showRedPoints ? '隐藏异常图片' : '显示异常图片') }}
            </el-button>
          </template>
          
          <!-- 异常类型筛选区域 -->
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

      <!-- 3D模型展示容器 -->
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
            <div class="loading-status">
              {{ modelLoadingProgress < 95 ? '加载模型中...' : '准备渲染...' }}
            </div>
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
              <!-- 异常类型标签显示 -->
              <div class="abnormal-type-tags" v-if="image.abnormalTypes?.length">
                <el-tag 
                  v-for="(type, idx) in image.abnormalTypes" 
                  :key="idx" 
                  size="small" 
                  type="danger"
                  class="abnormal-type-tag"
                >
                  {{ type }}
                </el-tag>
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
    
    <!-- 图片详情弹窗 -->
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
// 导入Vue相关功能
import { ref, onMounted, onUnmounted, computed } from 'vue'
// 导入路由相关功能
import { onBeforeRouteLeave, useRouter } from 'vue-router'
// 导入Three.js相关库
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// 导入Element Plus组件
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 配置基础请求地址
axios.defaults.baseURL = 'http://110.42.214.164:8004'

// 定义颜色序列
const colorSequence = [
  '#006D5B', // 深青色
  '#008080', // 青色
  '#4CABA6', // 中青色
  '#7AC5CD', // 浅青色
  '#B2DFDB', // 淡青色
  '#E0F2F1'  // 极淡青色
]

// 定义响应式状态变量
const imageLoading = ref(false) // 图片加载状态
const dialogLoadingProgress = ref(0) // 弹窗图片加载进度
const modelLoading = ref(true) // 模型加载状态
const modelLoadingProgress = ref(0) // 模型加载进度
const showRedPoints = ref(false) // 是否显示红点
const imageCards = ref([]) // 图片卡片数据
const redPoints = ref([]) // 红点数据
const orangeMarkers = ref([]) // 橙色标记数据
const imageCoordinates = ref([]) // 图片坐标数据
const dialogVisible = ref(false) // 弹窗可见性
const currentImage = ref('') // 当前显示的图片
const isRendering = ref(true) // 是否正在渲染
const currentAbnormalDetails = ref([]) // 当前异常详情
const usedColors = ref([]) // 已使用的颜色
const abnormalTypes = ref([]) // 异常类型列表
const selectedAbnormalTypes = ref([]) // 选中的异常类型
const abnormalDataLoading = ref(false) // 异常数据加载状态
const abnormalDataReady = ref(false) // 异常数据是否就绪

// 获取路由实例
const router = useRouter()

// 初始化Three.js相关变量
let model, controls, camera, scene, renderer
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

/**
 * 获取对比色（根据背景色决定文字颜色）
 * @param {string} hexColor 十六进制颜色值
 * @returns {string} 黑色或白色
 */
const getContrastColor = (hexColor) => {
  if (!hexColor) return '#ffffff'
  const r = parseInt(hexColor.substr(1, 2), 16)
  const g = parseInt(hexColor.substr(3, 2), 16)
  const b = parseInt(hexColor.substr(5, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

/**
 * 获取下一个可用颜色
 * @returns {string} 下一个可用颜色
 */
const getNextAvailableColor = () => {
  for (const color of colorSequence) {
    if (!usedColors.value.includes(color)) {
      return color
    }
  }
  usedColors.value = []
  return colorSequence[0]
}

/**
 * 清理资源函数
 */
const cleanupResources = () => {
  console.log('开始清理资源...')
  
  // 停止渲染循环
  isRendering.value = false
  
  try {
    // 移除事件监听器
    const container = document.getElementById('threejs-container')
    if (container) {
      container.removeEventListener('click', onPointerClick)
      // 移除canvas元素
      const canvas = container.querySelector('canvas')
      if (canvas) {
        container.removeChild(canvas)
      }
    }
    
    // 移除window事件监听器
    window.removeEventListener('resize', handleResize)
    
    // 清理Three.js控制器
    if (controls) {
      controls.dispose()
      controls = null
    }
    
    // 清理Three.js场景
    if (scene) {
      scene.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      
      // 清空场景
      while (scene.children.length > 0) {
        scene.remove(scene.children[0])
      }
      scene = null
    }
    
    // 清理渲染器
    if (renderer) {
      renderer.dispose()
      renderer.forceContextLoss()
      renderer = null
    }
    
    // 清理图片blob URLs
    imageCards.value.forEach(card => {
      if (card.imagePath && card.imagePath.startsWith('blob:')) {
        URL.revokeObjectURL(card.imagePath)
      }
    })
    
    if (currentImage.value && currentImage.value.startsWith('blob:')) {
      URL.revokeObjectURL(currentImage.value)
    }
    
    // 重置所有状态
    imageCards.value = []
    redPoints.value = []
    orangeMarkers.value = []
    imageCoordinates.value = []
    usedColors.value = []
    abnormalTypes.value = []
    selectedAbnormalTypes.value = []
    currentImage.value = ''
    currentAbnormalDetails.value = []
    dialogVisible.value = false
    showRedPoints.value = false
    modelLoading.value = true
    imageLoading.value = false
    abnormalDataLoading.value = false
    abnormalDataReady.value = false
    
    console.log('资源清理完成')
  } catch (e) {
    console.warn('资源清理过程中出现警告：', e)
  }
}

/**
 * 退出并返回首页
 */
const exitAndGoHome = async () => {
  try {
    cleanupResources()
    // 延迟跳转确保清理完成
    await new Promise(resolve => setTimeout(resolve, 100))
    router.push('/')
  } catch (error) {
    console.error('清理失败，强制跳转:', error)
    router.push('/')
  }
}

/**
 * 计算是否所有类型都被选中
 */
const allTypesSelected = computed(() => {
  return abnormalTypes.value.length > 0 && 
         selectedAbnormalTypes.value.length === abnormalTypes.value.length
})

/**
 * 全选/取消全选异常类型
 */
const selectAllTypes = () => {
  if (allTypesSelected.value) {
    selectedAbnormalTypes.value = []
  } else {
    selectedAbnormalTypes.value = [...abnormalTypes.value]
  }
  updateVisiblePoints()
}

/**
 * 加载异常数据
 */
const loadAbnormalData = async () => {
  try {
    const res = await axios.get('/imageData/all-abnormal-images')
    imageCoordinates.value = res.data.data.map(d => ({
      imageId: d.imageId,
      centerX: d.centerX,
      centerY: d.centerY,
      centerZ: d.centerZ,
      abnormalDetailList: d.abnormalDetailList || []
    }))
    extractAbnormalTypes()
    abnormalDataReady.value = true
  } catch (error) {
    ElMessage.error('加载异常坐标失败')
    throw error
  }
}

/**
 * 跟踪图片下载进度
 * @param {string} imageUrl 图片URL
 * @param {Ref} progressRef 进度引用
 * @returns {Promise<string>} blob URL
 */
const trackImageDownload = async (imageUrl, progressRef) => {
  progressRef.value = 0
  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      cache: 'no-cache',
    })
    
    if (!response.ok) throw new Error(`HTTP错误! 状态: ${response.status}`)
    
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
    console.error('下载图片错误:', error)
    progressRef.value = 0
    return null
  }
}

/**
 * 更新可见红点
 */
const updateVisiblePoints = () => {
  if (!showRedPoints.value || !renderer || !scene || !camera) return
 
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
 
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

/**
 * 显示图片弹窗
 * @param {Object} image 图片对象
 */
const showImageDialog = (image) => {
  currentImage.value = image.imagePath
  dialogVisible.value = true
}

/**
 * 切换红点显示状态
 */
const toggleRedPoints = async () => {
  if (!showRedPoints.value) {
    // 显示红点前先检查数据是否已加载
    if (!abnormalDataReady.value) {
      abnormalDataLoading.value = true
      try {
        await loadAbnormalData()
      } catch (error) {
        abnormalDataLoading.value = false
        return
      }
      abnormalDataLoading.value = false
    }
    
    showRedPoints.value = true
    orangeMarkers.value.forEach(m => m.visible = false)
    
    if (redPoints.value.length === 0) {
      createRedPoints()
    } else {
      updateVisiblePoints()
    }
  } else {
    // 隐藏红点
    showRedPoints.value = false
    redPoints.value.forEach(dot => dot.visible = false)
    orangeMarkers.value.forEach(m => m.visible = true)
    
    // 新增：隐藏所有通过红点添加的照片框
    imageCards.value = imageCards.value.filter(card => {
      // 保留非异常图片（通过Shift+点击添加的图片）
      const isNormalImage = !redPoints.value.some(dot => dot.userData.imageId === card.imageId)
      if (!isNormalImage && card.imagePath && card.imagePath.startsWith('blob:')) {
        URL.revokeObjectURL(card.imagePath)
      }
      return isNormalImage
    })
    
    // 重置红点的点击状态和颜色
    redPoints.value.forEach(dot => {
      dot.userData.clicked = false
      dot.material.color.set(0xff0000)
    })
    
    // 重置颜色使用记录
    usedColors.value = []
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

/**
 * 创建红点
 */
const createRedPoints = () => {
  if (!scene) return
 
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

/**
 * 处理指针点击事件
 * @param {Event} event 点击事件
 */
const onPointerClick = async (event) => {
  if (!scene || !camera || !renderer) return
 
  const container = document.getElementById('threejs-container')
  if (!container) return
 
  const rect = container.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1
  raycaster.setFromCamera(pointer, camera)

  // 处理红点点击
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
          
          if (!imageUrl) throw new Error('无图片URL')
          
          // 获取所有异常类型
          const abnormalTypes = imageData.abnormalDetailList?.map(d => d.typeName) || []

          const newCard = {
            imageId: imageData.imageId,
            imagePath: '',
            loading: true,
            loadingProgress: 0,
            abnormalTypes: abnormalTypes, // 改为数组形式存储所有类型
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
          console.error('错误:', error)
          dot.userData.clicked = false
          ElMessage.error('获取图片信息失败')
        }
      }
    }
    return
  }

  // 处理Shift+点击查看图片
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
          
          if (!imageUrl) throw new Error('无图片URL')
          
          currentAbnormalDetails.value = d.abnormalDetailList || []
          const blobUrl = await trackImageDownload(imageUrl, dialogLoadingProgress)
          
          if (blobUrl) {
            currentImage.value = blobUrl
          } else {
            throw new Error('图片下载失败')
          }
        } else {
          throw new Error('无数据')
        }
      } catch (error) {
        console.error('错误:', error)
        imageLoading.value = false
        dialogVisible.value = false
        ElMessage.warning('当前位置暂无匹配图片')
        if (scene && mk) {
          scene.remove(mk)
        }
        orangeMarkers.value.pop()
      }
    }
  }
}

/**
 * 移除图片
 * @param {number} idx 图片索引
 */
const removeImage = async (idx) => {
  const img = imageCards.value[idx]
  if (img.dotColor) {
    usedColors.value = usedColors.value.filter(c => c !== img.dotColor)
  }
  
  // 清理blob URL
  if (img.imagePath && img.imagePath.startsWith('blob:')) {
    URL.revokeObjectURL(img.imagePath)
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
    if (mk && scene) {
      scene.remove(mk)
    }
    orangeMarkers.value.splice(idx, 1)
  }
  
  imageCards.value.splice(idx, 1)
  imageCards.value.forEach((card, index) => {
    card.sequenceNumber = index + 1
  })
}

/**
 * 提取异常类型
 */
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

/**
 * 处理窗口resize事件
 */
const handleResize = () => {
  if (!camera || !renderer || !isRendering.value) return
 
  const container = document.getElementById('threejs-container')
  if (container) {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }
}

// 路由离开守卫
onBeforeRouteLeave((to, from, next) => {
  cleanupResources()
  next()
})

// 组件挂载时初始化
onMounted(() => {
  // 初始化Three.js场景
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  
  const container = document.getElementById('threejs-container')
  if (!container) {
    console.error('Three.js容器未找到')
    return
  }
  
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)

  // 添加光照
  scene.add(new THREE.AmbientLight(0xffffff, 1.5))
  const dl = new THREE.DirectionalLight(0xffffff, 2)
  dl.position.set(5, 5, 5)
  scene.add(dl)

  // 加载GLTF模型
  const loader = new GLTFLoader()
  loader.load(
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
      
      // 添加延迟确保渲染完成
      setTimeout(() => {
        modelLoading.value = false
      }, 300)
    },
    xhr => {
      if (xhr.lengthComputable) {
        // 将进度限制在95%，留5%给后续处理
        modelLoadingProgress.value = Math.min(
          Math.round((xhr.loaded / xhr.total) * 95),
          95
        )
      }
    },
    e => {
      console.error('模型加载失败', e)
      modelLoading.value = false
    }
  )

  // 初始化轨道控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
  }

  // 处理鼠标事件
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

  // 设置相机位置
  camera.position.set(0, 5, 10)
  camera.lookAt(0, 0, 0)

  // 渲染循环
  const animate = () => {
    if (isRendering.value && controls && renderer && scene && camera) {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
  }
  animate()

  // 添加事件监听器
  container.addEventListener('click', onPointerClick)
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理资源
onUnmounted(() => {
  console.log('组件卸载，开始清理资源...')
  cleanupResources()
})
</script>

<style scoped>
/* 模型容器样式 */
.model-container {
  width: 65%;
  height: 65vh;
  margin: 20px auto;
  position: relative;
}

/* Three.js容器样式 */
.threejs-container {
  width: 100%;
  height: 100%;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: linear-gradient(145deg, #f5f5f5, #ffffff);
}

/* 图片容器样式 */
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

/* 卡片基础样式 */
.card {
  transition: all 0.3s;
  border: 2px solid transparent;
}
.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

/* 图片卡片图片样式 */
.image-card-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 4px;
}

/* 弹窗图片样式 */
.dialog-image {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 关闭按钮样式 */
.close-btn {
  transition: all 0.2s ease;
}
.close-btn:hover {
  transform: scale(1.1);
  background-color: rgba(255, 0, 0, 0.8) !important;
}

/* 信息卡片样式 */
.info-card {
  position: absolute;
  top: 8%;
  left: 2%;
  z-index: 1000;
}

/* 附加功能卡片样式 */
.additional-card {
  position: absolute;
  top:43%;
  left: 2%;
  z-index: 1000;
}

/* 卡片基础样式 */
.box-card {
  width: 200px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 卡片标题样式 */
.card-header-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

/* 卡片列表样式 */
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

/* 加载容器样式 */
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

/* 弹窗容器样式 */
.dialog-container {
  position: relative;
  width: 100%;
  min-height: 300px;
}

/* 弹窗加载容器样式 */
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

/* 进度文本样式 */
.progress-text {
  margin-top: 10px;
  font-size: 14px;
  color: #409EFF;
  font-weight: bold;
}

/* 卡片内容样式 */
.card-content {
  position: relative;
  width: 100%;
  height: 180px;
}

/* 筛选容器样式 */
.filter-container {
  margin-top: 10px;
}

/* 筛选头部样式 */
.filter-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

/* 筛选标题样式 */
.filter-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

/* 复选框项样式 */
.checkbox-item {
  display: block;
  margin-bottom: 6px;
}

/* 异常类型标签容器样式 */
.abnormal-type-tags {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 80%; /* 防止标签过多溢出 */
}

/* 单个标签样式 */
.abnormal-type-tag {
  margin-right: 4px;
  margin-bottom: 4px;
  white-space: nowrap; /* 防止标签内文字换行 */
}

/* 异常详情样式 */
.abnormal-details {
  margin-top: 15px;
}

/* 异常详情项样式 */
.abnormal-detail-item {
  margin: 8px 0;
  display: flex;
  align-items: center;
}

/* 详情描述样式 */
.detail-description {
  margin-left: 8px;
  font-size: 14px;
  color: #606266;
}

/* 模型加载覆盖层样式 */
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

/* 卡片列表键盘样式 */
.card-list kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 12px;
  font-family: monospace;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* 顶部按钮样式 */
.top-right-button {
  position: absolute;
  top: 8%;
  right: 6%;
  z-index: 2;
  width: 120px;
}

/* 照片序列标签样式 */
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

/* 弹窗图片样式 */
.dialog-image {
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
  cursor: pointer;
  display: block;
  margin: 0 auto;
}

/* 弹窗容器样式 */
.dialog-container {
  position: relative;
  width: 100%;
  min-height: 300px;
  text-align: center;
}

/* 按钮提示样式 */
.button-hint {
  margin-top: 8px;
  font-size: 18px;
  color: #9f0b0b;
  text-align: center;
  line-height: 1.4;
}

/* 加载状态文本样式 */
.loading-status {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}
</style>