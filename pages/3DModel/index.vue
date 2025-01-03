<template>
  <div style="position: fixed; right: 10px; top: 10px; z-index: 1000;">
    <el-button type="primary" class="back-to-main-btn" @click="backToMain" style="position: absolute; right: 0; top: 0;">
      返回主页
    </el-button>
  </div>

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
              :style="{ borderColor: image.borderColor }"> <!-- 动态绑定边框颜色 -->
            <div class="card-content">
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


// 从后端获取所有异常图片坐标
const fetchImageCoordinates = async () => {
  try {
    // 注释掉实际请求后端的代码
    const response = await axios.get('http://110.42.214.164:8004/imageData/allCoordinates');
    imageCoordinates.value = response.data.data; // 假设返回的数据格式为 { data: [坐标数组] }

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
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });

  const container = document.getElementById('threejs-container');
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);
  camera.position.set(0, 2, 5);

  const loader = new GLTFLoader();
  loader.load('同济大学地震馆gltf/同济大学地震工程馆模型.gltf', (gltf) => {
    model = gltf.scene;
    scene.add(model);
  });

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 创建基准点：绿色小球体
  const redSphereGeometry = new THREE.SphereGeometry(0.1); // 半径为 0.1 的小球体
  const redSphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // 绿色
  const redSphere = new THREE.Mesh(redSphereGeometry, redSphereMaterial);
  scene.add(redSphere); // 将基准点添加到场景

  // 创建箭头帮助器（分别指向 x, y, z 方向）
  const arrowLength = 12;  // 增加箭头的长度
  const arrowHeadLength = 2;  // 增加箭头头部的长度
  const arrowHeadWidth = 0.8;  // 增加箭头头部的宽度

  // X轴箭头（绿色）指向正X轴
  const xArrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), // 箭头的方向，指向正 x 轴
      new THREE.Vector3(0, 0, 0), // 箭头的起始点，基准点
      arrowLength, // 箭头的长度
      0x00ff00, // 绿色
      arrowHeadLength, // 箭头头部的长度
      arrowHeadWidth, // 箭头头部的宽度
  );

  // Y轴箭头（绿色）指向正Y轴
  const yArrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0), // 箭头的方向，指向正 y 轴
      new THREE.Vector3(0, 0, 0), // 箭头的起始点，基准点
      arrowLength, // 箭头的长度
      0x00ff00, // 绿色
      arrowHeadLength, // 箭头头部的长度
      arrowHeadWidth, // 箭头头部的宽度
  );

  // Z轴箭头（绿色）指向正Z轴
  const zArrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1), // 箭头的方向，指向正 z 轴
      new THREE.Vector3(0, 0, 0), // 箭头的起始点，基准点
      arrowLength, // 箭头的长度
      0x00ff00, // 绿色
      arrowHeadLength, // 箭头头部的长度
      arrowHeadWidth, // 箭头头部的宽度
  );

  // 添加箭头到场景
  scene.add(xArrowHelper);
  scene.add(yArrowHelper);
  scene.add(zArrowHelper);

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // 从后端获取异常图片坐标
  fetchImageCoordinates();

  container.addEventListener('click', onPointerClick);
  container.addEventListener('mousemove', onPointerMove); // 鼠标移动事件，用于悬停效果
});


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
      // 如果图片数量已满，不设置红点为不可点击，并直接跳过插入图片的操作
      if (imageCards.value.length >= 5) {
        console.log("图片数量已达到上限！");
        alert('图片数量已达到上限！');
      } else {
        // 否则继续处理点击逻辑
        redDot.userData.clicked = true;  // 标记为已点击

        // 从颜色池中轮流取颜色
        if (colorPool.value.length > 0) {
          const color = colorPool.value.shift(); // 获取颜色池中的第一个颜色并移除它
          redDot.material.color.set(color);  // 设置红点颜色
          redDot.userData.color = color; // 记录颜色，用于后续删除照片框时恢复颜色

          // 同时更新图片框的外边框颜色
          const image = imageCards.value.find(img => !img.color); // 找到第一个未分配颜色的图片框
          if (image) {
            image.borderColor = color; // 为该图片框的外边框设置相同的颜色
          }
        }

        // 获取该红点的 tempId，发起请求
        const tempId = redDot.userData.tempId;
        console.log(`点击的红点的临时 ID: ${tempId}`);

        try {
          const response = await axios.get('http://110.42.214.164:8004/imageData/closest', {
            params: {
              clickX: (-intersectPoint.x).toFixed(2),
              clickY: intersectPoint.y.toFixed(2),
              clickZ: intersectPoint.z.toFixed(2),
            },
          });

          if (response.data.code === 200 && response.data.data) {
            const { imageId, imagePath } = response.data.data;

            // 更新红点的 imageId 和颜色
            redDot.userData.imageId = imageId;

            // 在图片框中添加图片
            const image = {
              imageId,
              imagePath,
              surfaceId: response.data.data.surfaceId,
              centerX: response.data.centerX,
              centerY: response.data.centerY,
              centerZ: response.data.centerZ,
              color: redDot.userData.color, // 将红点颜色赋给图片框的 borderColor
              borderColor: redDot.userData.color // 同时将颜色赋给图片框的外边框
            };

            if (imageCards.value.length < 5) {
              imageCards.value.push(image);
            } else {
              console.log('图片数量已达到上限！');
              alert('图片数量已达到上限！');
            }
          } else {
            alert(`获取图片失败：${response.data.message || '未知错误'}`);
          }
        } catch (error) {
          console.error('获取图片失败:', error.message);
          alert('网络错误或接口调用失败，请稍后重试！');
        }
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

.model-container {
  position: absolute;
  top: 5%;
  left: 10%;
  width: 80%;
  height: 60%;
}

.threejs-container {
  width: 100%;
  height: 100%;
  border: 1px solid black;
  border-radius: 5px;
  background-color: #f0f0f0;
}

.-container {
  position: absolute;
  bottom: 50px;
  width: 100%;
  padding: 20px;
}

.card {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 4px solid #333; /* 深灰色边框 */
}

.card-content {
  text-align: center;
}

.el-card {
  border-radius: 10px;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0;
  height: 20px;
  width: 20px;
}

.image-card-img {
  width: 100%;
  height: auto;
}
</style>