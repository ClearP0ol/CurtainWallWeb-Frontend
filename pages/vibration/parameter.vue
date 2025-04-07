<template> 
  <div id="app" class="app-container">
    <div style="position: fixed; right: 10px; top: 15px; z-index: 1000;">
      <el-button type="primary" @click="backToMain">返回主页</el-button>
    </div>

    <!-- 主体内容 -->
    <div class="outlayer">
      <!-- 参数面板 -->
      <div  class="parameter-panel">
        <UForm class="parameter-form">
        
          <div class="parameter-group">
            <h2 class="green-underline-title">台阵设置</h2>
            <hr class="divider" />
            <div class="parameter-row">
              <div class="parameter-icon">
                <i class="fas fa-clock"></i>
              </div>
              <h1>台阵选择：</h1>
              <USelectMenu
                v-model="selectedDevice"
                placeholder="请台阵选择"
                :options="deviceOptions"
                id="timeScale"
              />
            </div>

            <!-- mod-->
            <!-- 台阵位置 -->
            <div class="parameter-row">
              <div class="parameter-icon">
                <i class="fas fa-map-marker-alt"></i>
              </div>
              <h1>台阵位置：</h1>
              <UInput  v-model="devicePlace" />
            </div>
            <!-- 台阵设置应用按钮 -->
            <div class="parameter-row">
              <UButton type="primary" @click="applyArraySettings">应用</UButton>
            </div>

          </div>

          <div class="parameter-group">
            <h2 class="green-underline-title">数据校准</h2>
            <hr class="divider" />
            <div class="parameter-row">
              <div class="parameter-icon">
                <i class="fas fa-arrows-alt-h"></i>
              </div>
              <h1>X偏移：</h1>
              <UInput v-model="xOffset" />
            </div>


            <!-- Y偏移 -->
            <div class="parameter-row">
              <div class="parameter-icon">
                <i class="fas fa-arrows-alt-v"></i>
              </div>
              <h1>Y偏移：</h1>
              <UInput v-model="yOffset" />
            </div>

            <!-- Z偏移 -->
            <div class="parameter-row">
              <div class="parameter-icon">
                <i class="fas fa-cube"></i>
              </div>
              <h1>Z偏移：</h1>
              <UInput v-model="zOffset" />
            </div>
           
            <!-- 数据校准应用按钮 -->
            <div class="parameter-row">
              <UButton type="primary" @click="applyCalibration">应用</UButton>
            </div>
          </div>

          <!-- 限值设置 -->
          <div class="parameter-group">
            <h2 class="green-underline-title">限值设置</h2>
            <hr class="divider" />
            <div class="parameter-row">
              <div class="parameter-icon">
                <i class="fas fa-sliders-h"></i>
              </div>
              <h1>上限设置：</h1>
              <UInput v-model="upperBound" />
            </div>

            <div class="parameter-row">
              <div class="parameter-icon">
                <i class="fas fa-sliders-h"></i>
              </div>
              <h1>下限设置：</h1>
              <UInput v-model="lowerBound" />
            </div>

            <div class="parameter-row">
              <div class="parameter-icon">
                <i class="fas fa-envelope"></i>
              </div>
              <h1>邮箱红线设置：</h1>
              <UInput v-model="emailLimitSetting" />
            </div>

            <div class="parameter-row">
              <div class="parameter-icon">
                <i class="fas fa-sms"></i>
              </div>
              <h1>短信红线设置：</h1>
              <UInput v-model="messageLimitSetting" />
            </div>

            <!-- 限值设置应用按钮 -->
            <div class="parameter-row">
              <UButton type="primary" @click="applyLimits">应用</UButton>
            </div>
          </div>
        </UForm>
      </div>
    </div>
  </div>
</template>


<script>
import {useRouter} from "vue-router";
const API_BASE_URL = 'http://110.42.214.164:8009';
const backToMain = () => {
  router.push("/subindex");
};
export default {
  name: 'DeviceControlApp',
  setup() {
    const router = useRouter();
    const backToMain = () => {
      router.push("/subindex");
    };

    return {
      backToMain
    };
  },
  data() {
    return {
      deviceOptions: [
        { value: 'F001', label: '风压'},
        { value: '4787BE3A', label: '综合楼05' },
        { value: '8850A7D7', label: '综合楼04' },
        { value: '8361D7CD', label: '综合楼03' },
        { value: '612B04ED', label: '综合楼02' },
        { value: 'E884C99D', label: '综合楼01' },
        { value: 'E43AC643', label: '安楼06' },
        { value: '29FA1867', label: '安楼05' },
        { value: '87C3D4E4', label: '安楼04'},
        { value: '9A0D1958', label: '安楼03' },
        { value: 'F853ED49', label: '安楼02' },
        { value: 'A77C5238', label: '安楼01'},
      ],
 
      selectedDevice: { value: 'F001', label: '风压'},
      upperBound: 10,
      lowerBound: 10,
      emailLimitSetting:25,
      messageLimitSetting:35,
      devicePlace: '综合楼05',

      xOffset: 0,  // X偏移
      yOffset: 0,  // Y偏移
      zOffset: 0,   // Z偏移
    };
  },
  computed: {

  },
  methods: { 
      // 台阵设置应用
    async updateSingle(item) {
      try {
        const url = `${API_BASE_URL}/data/update_threshold_or_offset?device=${item.device}&type=${item.type}&value=${item.value}`
        const response = await fetch(url)
        return await response.json()
      } catch (error) {
        console.error('更新失败:', error)
        throw error
      }
    },


    async applyArraySettings() {
      const updates = [
        { device: this.selectedDevice.value, type: 'device_name', value: this.devicePlace },
        { device: '29FA1867', type: 'down', value: 0.3 },
        { device: '29FA1867', type: 'offset', value: 0.1 }
      ]
      
      const results = await Promise.all(
        updates.map(item => this.updateSingle(item))
      )
      
      console.log('批量更新结果:', results)
    },

    async applyCalibration() {
      const updates = [
        { device: this.selectedDevice.value, type: 'x_offset', value: this.xOffset },
        { device: this.selectedDevice.value, type: 'y_offset', value: this.yOffset },
        { device: this.selectedDevice.value, type: 'z_offset', value: this.zOffset },
      ]
      
      const results = await Promise.all(
        updates.map(item => this.updateSingle(item))
      )
      console.log('批量更新结果:', results)
    },
    
    async  applyLimits() {
      const updates = [
        { device: this.selectedDevice.value, type: 'up', value: this.upperBound },
        { device: this.selectedDevice.value, type: 'down', value: this.lowerBound },
        { device: this.selectedDevice.value, type: 'email_limit', value: this.emailLimitSetting },
        { device: this.selectedDevice.value, type: 'message_limit', value: this.messageLimitSetting },
      ]
      const results = await Promise.all(
        updates.map(item => this.updateSingle(item))
      )
      console.log('批量更新结果:', results)
    },

  },
};
</script>

<style scoped>
/* 页面布局 */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
.app-container {
  width:100%;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f5f7;
}

.green-underline-title {
  color: green;
  text-decoration: underline;
  margin-bottom: 10px;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 10px 20px;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Navbar 容器样式 */
.navBar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #f0f0f0;
}

/* 标题样式 */
.app-title {
  font-size: 24px;
  font-weight: bold; /* 设置粗体 */
  margin-bottom: 20px; /* 设置与按钮的距离 */
}

/* 按钮容器样式 */
.nav-buttons {
  display: flex;
  gap: 20px; /* 按钮之间的间距 */
}

/* 按钮默认样式 */
.nav-buttons button {
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent; /* 默认没有底线 */
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 按钮 hover 样式 */
.nav-buttons button:hover {
  color: #007bff;
}

/* 当前选中按钮的样式 */
.nav-buttons button.active {
  color:#28a745; /* 激活时的文本颜色 */
  border-bottom: 2px solid #28a745; /* 绿色下划线 */
  font-weight: bold;
}

@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #ffffff;
}

.parameter-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  padding: 2rem;
}

.parameter-form {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.parameter-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
}

.parameter-group {
  display: flex;
  flex-direction: column;  /* 添加这行来实现纵向排列 */
  align-items: left;
  gap: 1rem;
  background: #f9f9f9;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.parameter-icon {
  font-size: 1.5rem;
  color: #4caf50;
}

.parameter-label {
  flex: 1;
  font-weight: bold;
}

.parameter-input {
  flex: 2;
}


/* 面板展开/收起动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease; /* 动画效果 */
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0; /* 起始/结束透明度 */
  transform: translateY(10px); /* 起始/结束位置偏移 */
}

.outlayer {
  width: 100%; /* 占满屏幕 */
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.device-section,
.charts-section {
  margin: 20px;
}

.section-title {
  font-size: 20px;
  margin-bottom: 10px;
}

.device-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.device-box {
  width: 80px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.charts-section {
  margin: 20px 0;
}

.section-title {
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.charts-container {
  display: flex;
  flex-direction: column; /* 纵向排列 */
  gap: 20px; /* 图表之间的间距 */
}

.chart-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%; /* 占满页面宽度 */
}

.chart-title {
  font-size: 16px;
  margin-bottom: 10px;
  font-weight: bold;
  text-align: center; /* 标题居中 */
}

.chart {
  width: 100%; /* 占满父容器宽度 */
  height: 300px; /* 固定高度 */
}

.scale-slider {
  margin-top: 10px;
  width: 100%; /* 滑块宽度与图一致 */
}

/* 修改智能助手的样式 */
.ai-assistant-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.assistant-toggle-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #007bff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  transition: transform 0.3s ease;
}

.assistant-toggle-btn:hover {
  transform: scale(1.1);
}

.chat-window-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.chat-header {
  padding: 10px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.chat-input {
  padding: 15px;
  background: #fff;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.chat-input button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.chat-input button:hover {
  background: #0056b3;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

/* 添加消息样式 */
.message {
  margin: 10px;
  padding: 10px;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  margin-left: auto;
  background-color: #e3f2fd;
  text-align: right;
}

.message.assistant {
  margin-right: auto;
  background-color: #f5f5f5;
  text-align: left;
}

.message-header {
  margin-bottom: 5px;
  font-size: 0.9em;
  color: #666;
}

.message-content {
  word-break: break-word;
}

.message-text {
  line-height: 1.5;
}
.divider {
  margin: 2px;
  border: none;
  border-top: 1px solid #e0e0e0;
}
</style>


