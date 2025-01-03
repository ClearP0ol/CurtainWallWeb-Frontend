<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <!-- 3D模型显示部分 -->
      <div class="model-container">
        <el-divider content-position="center">3D 模型展示</el-divider>
        <div id="threejs-container" class="threejs-container"></div>
      </div>
    </UDashboardPanel>
    <!-- 五个图片框 -->
    <div class="-container">
      <el-row :gutter="20">
        <el-col :span="4" v-for="(image, index) in imageCards" :key="'dynamic-' + index">
          <el-card
              :body-style="{ padding: '0px' }"
              class="card"
              shadow="hover"
              :style="{ borderColor: image.borderColor }">
            <div class="card-content">
              <!-- 异常类型标签 -->
              <div class="abnormal-label" v-if="image.abnormalLabels">
                <span>{{ image.abnormalLabels }}</span>
              </div>

              <img :src="image.imagePath" alt="Returned Image" class="image-card-img"/>
              <el-button
                  type="danger"
                  icon="el-icon-close"
                  size="small"
                  class="close-btn"
                  @click="removeImage(index)"
                  style="position: absolute; top: 10px; right: 10px; padding: 0; height: 20px; width: 20px;">
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </UDashboardPage>
  <!-- 日志框 -->
  <div class="log-container">
    <h3>交互日志</h3>
    <el-card v-for="log in interactionLogs" :key="log.logId">
      <p><strong>次序:</strong> {{ log.logId }}</p>
      <p><strong>坐标:</strong> ({{ log.clickX }}, {{ log.clickY }}, {{ log.clickZ }})</p>
    </el-card>
  </div>
  <!-- 上传按钮 -->
  <div class="add-exception-container">
    <h3>添加异常图片</h3>
    <div class="exception-checkboxes">
      <label><input type="checkbox" value="0"> 污渍</label>
      <label><input type="checkbox" value="1"> 锈蚀</label>
      <label><input type="checkbox" value="2"> 裂缝</label>
    </div>
    <input type="file" class="file-input" id="file-upload" accept=".txt">
    <button class="submit-btn" id="submit-btn" @click="handleSubmit">提交</button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import axios from 'axios';

let model;
let controls;
let camera;
let scene;
let renderer;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// 用于存储动态生成的图片框
const imageCards = ref([]);
// 用于存储红点的3D对象
const redPoints = ref([]);
// 用于存储所有异常图片的坐标
const imageCoordinates = ref([]);
// 天蓝、深蓝、粉色、紫色、黄色 颜色池
const colorPool = ref(['#00BFFF', '#00008B', '#FF69B4', '#800080', '#FFFF00']);
// 存储交互日志的数组
const interactionLogs = ref([]);
// 5种异常类型的布尔数组
const selectedAbnormalTypes = ref([false, false, false]);

const handleSubmit = async () => {
  // 获取用户勾选的异常类型并生成布尔数组（只包含三个异常类型）
  selectedAbnormalTypes.value = [
    document.querySelector('input[value="0"]').checked,
    document.querySelector('input[value="1"]').checked,
    document.querySelector('input[value="2"]').checked
  ];

  console.log(selectedAbnormalTypes.value);

  // 检查是否选择了异常类型
  if (!selectedAbnormalTypes.value.includes(true)) {
    alert('请选择异常类型');
    return; // 如果没有选择任何异常类型，退出函数
  }

  // 获取文件内容
  const fileInput = document.getElementById('file-upload');
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const fileContent = await readFileContent(file);

    // 记录文件内容到控制台
    console.log('上传的文件内容:', fileContent);

    // 将文件内容按行分割成数组
    const lines = fileContent.split('\n');

    // 遍历每一行URL并发送POST请求
    for (let line of lines) {
      const imagePath = line.trim(); // 每一行作为imagePath

      // 组装请求数据
      const requestData = {
        abnormalTypes: selectedAbnormalTypes.value,
        imagePath: imagePath,
      };

      // 调用后端API上传每个图片路径
      try {
        await uploadImage(requestData);
        console.log(`成功上传图片: ${imagePath}`);

      } catch (error) {
        console.error(`上传图片失败: ${imagePath}`, error);
      }
    }

  } else {
    alert('请先选择一个txt文件!');
  }
};

// 读取txt文件内容
const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// 上传图片的API
const uploadImage = async (data) => {
  try {
    const response = await axios.post('http://110.42.214.164:8004/imageData', data);
    if (response.data.code === 200) {
      console.log('图片上传成功:', response.data.message);
      console.log('异常类型:', selectedAbnormalTypes.value);

    } else {
      console.error('图片上传失败:', response.data.message);
    }
  } catch (error) {
    console.error('图片上传失败:', error);
  }
};

// 记录交互日志
const recordInteractionLog = async (intersectPoint) => {
  try {
    const response = await axios.post('http://110.42.214.164:8004/interactionLog', {
      clickX: intersectPoint.x.toFixed(2),
      clickY: intersectPoint.y.toFixed(2),
      clickZ: intersectPoint.z.toFixed(2),
    });

    if (response.data.code === 200) {
      console.log('日志记录成功');

      // 获取后端返回的字段
      const { clickX, clickY, clickZ } = response.data.data;

      // 将新的日志条目添加到日志数组
      interactionLogs.value.push({
        logId: interactionLogs.value.length + 1, // 使用序号代替时间
        clickX: -clickX?.toFixed(2) || 'N/A', // 确保值为数字且保留两位小数
        clickY: clickY?.toFixed(2) || 'N/A',
        clickZ: -clickZ?.toFixed(2) || 'N/A',
      });
      console.log('后端返回的数据:', interactionLogs.value);


    } else {
      console.error('日志记录失败:', response.data.message);
    }
  } catch (error) {
    console.error('记录交互日志失败:', error);
  }
};

// 从后端获取所有异常图片坐标
const fetchImageCoordinates = async () => {
  try {
    const response = await axios.get('http://110.42.214.164:8004/imageData/allCoordinates');
    imageCoordinates.value = response.data.data; // 返回的数据格式为 { data: [坐标数组] }

    addRedPointsToModel();
  } catch (error) {
    console.error('获取异常图片坐标失败:', error);
  }
};

// 添加红点到模型
const addRedPointsToModel = () => {
  imageCoordinates.value.forEach(coord => {
    const redDot = createRedDot(coord);
    redPoints.value.push(redDot);
    scene.add(redDot);
  });
};

const createRedDot = (position) => {
  let closestPoint = findClosestPoint(position);

  // 初始化红点颜色为红色
  const geometry = new THREE.SphereGeometry(0.8); // 半径为 0.8 的小球体
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // 红色
  const redDot = new THREE.Mesh(geometry, material);

  redDot.position.set(-closestPoint.centerX, closestPoint.centerY, closestPoint.centerZ);

  // 设置临时 ID 和点击状态
  redDot.userData = {
    tempId: closestPoint.tempId,
    clicked: false, // 设置红点初始为未点击状态
    color: '#ff0000' // 初始颜色是红色
  };

  return redDot;
};

// 计算并返回距离给定坐标最近的点
const findClosestPoint = (position) => {
  let closestPoint = null;
  let minDistance = Infinity;

  // 遍历所有传过来的点，计算距离
  imageCoordinates.value.forEach(coord => {
    const distance = calculateDistance(position, coord);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = coord;
    }
  });

  return closestPoint;
};

// 计算两个点之间的欧几里得距离
const calculateDistance = (point1, point2) => {
  const dx = point1.centerX - point2.centerX;
  const dy = point1.centerY - point2.centerY;
  const dz = point1.centerZ - point2.centerZ;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

onMounted(() => {
  initScene();
  initCamera();
  initRenderer();
  initLighting();
  loadModel();
  initControls();
  createReferencePoint();
  createArrowHelpers();
  animate();
  handleResize();
  fetchImageCoordinates();
  setupEventListeners();
});

// 初始化场景
function initScene() {
  scene = new THREE.Scene();
}

// 初始化相机
function initCamera() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);
}

// 初始化渲染器
function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  const container = document.getElementById('threejs-container');
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
}

// 初始化光源
function initLighting() {
  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);
}

// 加载3D模型
function loadModel() {
  const loader = new GLTFLoader();
  loader.load('同济大学地震馆gltf/同济大学地震工程馆模型.gltf', (gltf) => {
    model = gltf.scene;
    scene.add(model);
  });
}

// 初始化控制器
function initControls() {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
}

// 创建基准点：绿色小球体
function createReferencePoint() {
  const redSphereGeometry = new THREE.SphereGeometry(0.1);
  const redSphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const redSphere = new THREE.Mesh(redSphereGeometry, redSphereMaterial);
  scene.add(redSphere);
}

// 创建箭头帮助器（分别指向 x, y, z 方向）
function createArrowHelpers() {
  const arrowLength = 12;
  const arrowHeadLength = 2;
  const arrowHeadWidth = 0.8;

  const xArrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      arrowLength,
      0x00ff00,
      arrowHeadLength,
      arrowHeadWidth
  );

  const yArrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      arrowLength,
      0x00ff00,
      arrowHeadLength,
      arrowHeadWidth
  );

  const zArrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 0),
      arrowLength,
      0x00ff00,
      arrowHeadLength,
      arrowHeadWidth
  );

  scene.add(xArrowHelper);
  scene.add(yArrowHelper);
  scene.add(zArrowHelper);
}

// 动画渲染循环
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// 处理窗口大小变化
function handleResize() {
  window.addEventListener('resize', () => {
    const container = document.getElementById('threejs-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

// 设置事件监听
function setupEventListeners() {
  const container = document.getElementById('threejs-container');
  container.addEventListener('click', onPointerClick);
  container.addEventListener('mousemove', onPointerMove); // 鼠标移动事件，用于悬停效果
}

const checkImageLimit = () => {
  if (imageCards.value.length >= 5) {
    console.log("图片数量已达到上限！");
    alert('图片数量已达到上限！');
    return true;
  }
  return false;
};

const updateRedDotColor = (redDot) => {
  if (colorPool.value.length > 0) {
    const color = colorPool.value.shift(); // 获取颜色池中的第一个颜色并移除它
    redDot.material.color.set(color);  // 设置红点颜色
    redDot.userData.color = color; // 记录颜色，用于后续删除照片框时恢复颜色
    return color;
  }
  return null;
};

const fetchImageData = async (intersectPoint, redDot) => {
  try {
    const response = await axios.get('http://110.42.214.164:8004/imageData/closest', {
      params: {
        clickX: (-intersectPoint.x).toFixed(2),
        clickY: intersectPoint.y.toFixed(2),
        clickZ: intersectPoint.z.toFixed(2),
      },
    });

    if (response.data.code === 200 && response.data.data) {
      const { imageId, imagePath, surfaceId, abnormalTypes } = response.data.data; // 包括异常类型
      redDot.userData.imageId = imageId;

      // 调试输出
      console.log(`异常类型: ${abnormalTypes}`);  // 显示异常类型数组

      return { imageId, imagePath, surfaceId, abnormalTypes, response };
    } else {
      alert(`获取图片失败：${response.data.message || '未知错误'}`);
      return null;
    }
  } catch (error) {
    console.error('获取图片失败:', error.message);
    alert('网络错误或接口调用失败，请稍后重试！');
    return null;
  }
};

const updateImageCards = (redDot, imageData) => {
  const { imageId, imagePath, surfaceId, abnormalTypes } = imageData;

  // 异常类型标签
  const abnormalLabels = [
    abnormalTypes[0] ? '污渍' : '',
    abnormalTypes[1] ? '锈蚀' : '',
    abnormalTypes[2] ? '裂缝' : ''
  ].filter(label => label).join(', ');

  const image = {
    imageId,
    imagePath,
    surfaceId,
    abnormalTypes, // 存储异常类型
    abnormalLabels, // 存储异常类型的标签
    color: redDot.userData.color, // 红点颜色赋给图片框的 borderColor
    borderColor: redDot.userData.color,
  };

  if (imageCards.value.length < 5) {
    imageCards.value.push(image);
  } else {
    console.log('图片数量已达到上限！');
    alert('图片数量已达到上限！');
  }

  // 调试输出
  console.log(`更新的图片框异常类型标签: ${abnormalLabels}`);
};

const onPointerClick = async (event) => {
  const container = document.getElementById('threejs-container');
  const rect = container.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const redPointIntersects = raycaster.intersectObjects(redPoints.value, true);
  if (redPointIntersects.length > 0) {
    const intersectPoint = redPointIntersects[0].point;
    const redDot = redPointIntersects[0].object;

    // 如果该红点尚未点击
    if (!redDot.userData.clicked) {
      // 检查图片数量是否已满
      if (checkImageLimit()) return;

      // 否则继续处理点击逻辑
      redDot.userData.clicked = true;

      // 更新红点颜色
      const color = updateRedDotColor(redDot);

      // 获取图片数据并处理响应
      const imageData = await fetchImageData(intersectPoint, redDot);
      if (imageData) {
        // 更新图片框
        updateImageCards(redDot, imageData);

        // 更新日志
        await recordInteractionLog(intersectPoint);

      }
    }
  } else {
    console.log('未点击到红点');
  }
};

const onPointerMove = (event) => {
  const container = document.getElementById('threejs-container');
  const rect = container.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(redPoints.value, true);

  redPoints.value.forEach(dot => {
    dot.scale.set(1, 1, 1); // 恢复原始大小
  });

  if (intersects.length > 0) {
    const intersectedDot = intersects[0].object;
    intersectedDot.scale.set(1.5, 1.5, 1); // 放大红点
  }
};

const removeImage = (index) => {
  const image = imageCards.value[index];

  console.log(`删除的图片 ID: ${image.imageId}`);  // 调试输出

  imageCards.value.splice(index, 1);

  // 找到对应的红点并恢复为红色且可点击
  redPoints.value.forEach(redDot => {
    if (redDot.userData.imageId === image.imageId) {
      redDot.userData.clicked = false;
      redDot.material.color.set(0xff0000); // 恢复为红色
      colorPool.value.push(redDot.userData.color); // 恢复该颜色到颜色池
    }
  });
};


onUnmounted(() => {
  const container = document.getElementById('threejs-container');
  container.removeEventListener('click', onPointerClick);
  container.removeEventListener('mousemove', onPointerMove);
});
</script>

<style scoped>

.abnormal-label {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 15px;
  z-index: 10;
}

/* 模型容器样式 */
.model-container {
  width: 65%; /* 容器宽度 */
  height: 61%; /* 容器高度 */
  top: 5%; /* 顶部位置 */
  left: 5%; /* 左侧位置 */
}

/* Three.js 容器样式 */
.threejs-container {
  width: 100%; /* 占满父容器宽度 */
  height: 100%; /* 占满父容器高度 */
  border: 1px solid black; /* 黑色边框 */
  border-radius: 5px; /* 圆角边框 */
  background-color: #f0f0f0; /* 浅灰背景 */
}

/* 不明确命名的容器 */
.-container {
  position: absolute;
  bottom: 50px; /* 距底部距离 */
  width: 100%; /* 占满宽度 */
  padding: 20px; /* 内边距 */
}

/* 卡片样式 */
.card {
  height: 100%; /* 占满父容器高度 */
  display: flex; /* 使用弹性布局 */
  justify-content: center; /* 子项水平居中 */
  align-items: center; /* 子项垂直居中 */
  position: relative; /* 定位相对父容器 */
  border: 4px solid #333; /* 深灰色边框 */
}

/* 卡片内容样式 */
.card-content {
  text-align: center; /* 内容居中对齐 */
}

/* 关闭按钮样式 */
.close-btn {
  position: absolute;
  top: 10px; /* 距顶部距离 */
  right: 10px; /* 距右侧距离 */
  padding: 0; /* 无内边距 */
  height: 20px; /* 按钮高度 */
  width: 20px; /* 按钮宽度 */
}

/* 关闭按钮悬停样式 */
.close-btn:hover {
  background-color: #ff0000; /* 悬停时背景为浅红色 */
  border-radius: 50%; /* 按钮变成圆形 */
}

/* 图片卡片样式 */
.image-card-img {
  width: 100%; /* 占满父容器宽度 */
  height: auto; /* 高度自动调整 */
}

/* 日志容器样式 */
.log-container {
  position: fixed; /* 固定位置 */
  right: 8%; /* 距右侧距离 */
  bottom: 70%; /* 距底部距离 */
  width: 300px; /* 宽度固定 */
  height: 200px; /* 高度固定 */
  overflow-y: auto; /* 启用垂直滚动 */
  background-color: #fff; /* 白色背景 */
  border: 1px solid #ccc; /* 灰色边框 */
  padding: 10px; /* 内边距 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 阴影效果 */
  border-radius: 5px; /* 圆角边框 */
  font-size: 15px; /* 增大字体 */
}

/* 添加异常图片的容器样式 */
.add-exception-container {
  position: fixed; /* 固定位置 */
  right: 8%; /* 距右侧距离 */
  bottom: 33%; /* 距底部距离 */
  width: 300px; /* 宽度固定 */
  padding: 20px; /* 内边距 */
  background-color: #f9f9f9; /* 浅灰背景 */
  border: 1px solid #ccc; /* 灰色边框 */
  border-radius: 8px; /* 圆角边框 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 阴影效果 */
}

/* 异常图片标题样式 */
.add-exception-container h3 {
  margin-top: 0; /* 去掉顶部外边距 */
  font-size: 18px; /* 标题字体大小 */
  color: #333; /* 深灰色标题 */
}

/* 异常图片类型复选框的容器样式 */
.exception-checkboxes {
  display: flex; /* 使用弹性布局，便于横向排列 */
  flex-wrap: wrap; /* 当宽度不足时自动换行 */
  gap: 10px; /* 每个选项之间的间距 */
  margin: 10px 0; /* 整体上下边距 */
}

/* 每个复选框选项的样式 */
.exception-checkboxes label {
  display: flex; /* 使复选框和文字横向排列 */
  align-items: center; /* 垂直居中对齐 */
  font-size: 14px; /* 设置文字大小 */
  color: #333; /* 深灰色文字 */
  cursor: pointer; /* 鼠标悬停显示手型 */
}

/* 复选框本身的样式 */
.exception-checkboxes input[type="checkbox"] {
  margin-right: 8px; /* 复选框与文字的间距 */
}

/* 文件上传输入框样式 */
.file-input {
  width: 100%; /* 占满容器宽度 */
  margin: 10px 0; /* 上下间距 */
  padding: 8px; /* 内边距 */
  font-size: 14px; /* 字体大小 */
  border: 1px solid #aaa; /* 浅灰色边框 */
  border-radius: 4px; /* 圆角边框 */
}

/* 提交按钮样式 */
.submit-btn {
  width: 100%; /* 占满容器宽度 */
  margin: 10px 0; /* 上下间距 */
  padding: 8px; /* 内边距 */
  font-size: 14px; /* 字体大小 */
  border: none; /* 去掉边框 */
  border-radius: 4px; /* 圆角边框 */
  background-color: #333; /* 深灰色背景 */
  color: #fff; /* 白色文字 */
  cursor: pointer; /* 鼠标悬停显示手型 */
  transition: background-color 0.3s; /* 背景色过渡效果 */
}

/* 提交按钮悬停样式 */
.submit-btn:hover {
  background-color: #555; /* 悬停时背景变成中灰色 */
}

</style>
