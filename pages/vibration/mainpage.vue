<template>
  <div id="app" class="app-container">
    <header class="header">
      <nav class="navbar">
          <!-- 收起/展开按钮 -->
  <!-- 收起/展开按钮 -->
  <button class="toggle-button" @click="toggleParameterPanel">
    <i :class="isParameterPanelVisible ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
  </button>


  <!-- 参数面板 -->
  <div v-show="isParameterPanelVisible" class="parameter-container">
        <div class="parameter-container">
          <h3 class="parameter-title">参数设置</h3>
          <div class="parameter-row">
            <div class="parameter-item">
              <label for="timeScale"><i class="fas fa-clock"></i> 时间刻度：</label>
              <select id="timeScale" v-model="selectedTimeScale" @change="changeTimeScale">
                <option value="second">秒</option>
                <option value="minute">分</option>
                <option value="day">天</option>
              </select>
            </div>
            <div class="parameter-item">
              <label for="platformSelect"><i class="fas fa-network-wired"></i> 台阵选择：</label>
              <select id="platformSelect">
                <option>用户【幕墙振动监测】</option>
              </select>
            </div>
            <div class="parameter-item">
              <label for="platformName"><i class="fas fa-tag"></i> 台阵名称：</label>
              <input type="text" id="platformName" value="用户【幕墙振动监测】" />
            </div>
            <div class="parameter-item">
              <label for="platformLocation"><i class="fas fa-map-marker-alt"></i> 台阵位置：</label>
              <input type="text" id="platformLocation" value="上海市-市辖区-杨浦区" />
            </div>
            <div class="parameter-item">
            <label for="measurePoints">
              <i class="fas fa-ruler-combined"></i> 测点数量：
            </label>
            <input type="text" id="measurePoints" value="12个" />
          </div>

          <div class="parameter-item">
            <label for="directionSelect">
              <i class="fas fa-arrows-alt"></i> 方向选择：
            </label>
            <select id="directionSelect" v-model="selectedDirection" @change="changeDirection">
              <option value="x">X</option>
              <option value="y">Y</option>
              <option value="z">Z</option>
            </select>
          </div>

          <div class="parameter-item">
            <label for="yAxisZoom">
              <i class="fas fa-expand"></i> Y轴缩放：
            </label>
            <input type="text" id="yAxisZoom" v-model="yAxisZoom" @change="updateYAxisScale" />
          </div>

          <div class="parameter-item">
            <label for="gainFactor">
              <i class="fas fa-signal"></i> 增益系数：
            </label>
            <input type="text" id="gainFactor" v-model="gainFactor" @change="updateGain" />
          </div>

          <div class="parameter-item">
            <label for="deviceSearch">
              <i class="fas fa-search"></i> 设备查找：
            </label>
            <input type="text" id="deviceSearch" v-model="deviceSearch" @input="searchDevice" />
          </div>

          <div class="parameter-item">
            <label for="limitSetting">
              <i class="fas fa-sliders-h"></i> 限值设置：
            </label>
            <input type="text" id="limitSetting" v-model="limitSetting" @change="updateLimit" />
          </div>

          <div class="parameter-item">
            <label for="xOffset">
              <i class="fas fa-arrows-alt-h"></i> X偏移：
            </label>
            <input type="text" id="xOffset" v-model="xOffset" @change="updateOffsets" />
          </div>

          <div class="parameter-item">
            <label for="yOffset">
              <i class="fas fa-arrows-alt-v"></i> Y偏移：
            </label>
            <input type="text" id="yOffset" v-model="yOffset" @change="updateOffsets" />
          </div>

          <div class="parameter-item">
            <label for="zOffset">
              <i class="fas fa-cube"></i> Z偏移：
            </label>
            <input type="text" id="zOffset" v-model="zOffset" @change="updateOffsets" />
          </div>
          </div>
        </div>
      </div>
      </nav>
    </header>

    <main class="main-content">
      <!-- 设备选择区域 -->
      <section class="device-section">
        <h3 class="section-title">设备选择</h3>
        <div class="device-container">
          <div
            v-for="device in devices"
            :key="device.id"
            class="device-box"
            :style="{ backgroundColor: device.available ? '#4caf50' : '#9e9e9e' }"
            @click="selectDevice(device)"
          >
            {{ device.name }}
          </div>
        </div>
      </section>

      <!-- 图表区域 -->
      <section class="charts-section">
        <h3 class="section-title">数据图表</h3>
        <div class="charts-container">
          <div class="chart-card">
            <h4 class="chart-title">X轴图表</h4>
            <div id="xAxisChart" class="chart"></div>
            <input
              type="range"
              class="scale-slider"
              min="0.000001"
              max="0.0001"
              step="0.000001"
              v-model="xAxisScale"
              @input="updateChartScale('x', xAxisScale)"
            />
          </div>
          <div class="chart-card">
            <h4 class="chart-title">Y轴图表</h4>
            <div id="yAxisChart" class="chart"></div>
            <input
              type="range"
              class="scale-slider"
              min="0.0001"
              max="0.01"
              step="0.0001"
              v-model="yAxisScale"
              @input="updateChartScale('y', yAxisScale)"
            />
          </div>
          <div class="chart-card">
            <h4 class="chart-title">Z轴图表</h4>
            <div id="zAxisChart" class="chart"></div>
            <input
              type="range"
              class="scale-slider"
              min="0.000001"
              max="0.0001"
              step="0.000001"
              v-model="zAxisScale"
              @input="updateChartScale('z', zAxisScale)"
            />
          </div>
        </div>
      </section>

      <!-- 修改智能助手的位置 -->
      <div class="ai-assistant-container" :class="{ 'assistant-expanded': showAssistant }">
        <button @click="toggleAssistant" class="assistant-toggle-btn">
          <img src="./bot.png" alt="AI助手" class="assistant-icon"/>
        </button>
        
        <div v-if="showAssistant" class="chat-window-fullscreen">
          <div class="chat-header">
            <h2>智能助手</h2>
            <button @click="toggleAssistant" class="close-btn">×</button>
          </div>
          <div class="chat-messages" ref="chatMessages">
            <div v-for="(message, index) in chatHistory" 
                 :key="index" 
                 :class="['message', message.role]">
              <div class="message-content">
                <!-- 添加用户头像和名称 -->
                <div class="message-header">
                  <span class="message-sender">
                    {{ message.role === 'user' ? '用户' : 'AI助手' }}
                  </span>
                </div>
                <!-- 使用 v-html 来渲染可能包含 markdown 的内容 -->
                <div class="message-text" v-html="renderMessage(message)"></div>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <input v-model="userInput" 
                   @keyup.enter="sendMessage" 
                   placeholder="请输入您的问题..."
                   type="text">
            <button @click="sendMessage">发送</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 页面布局 */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f5f7;
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

/* 收起/展开按钮样式 */
.toggle-button {
  position: fixed; /* 固定定位 */
  bottom: 20px; /* 距离底部20px */
  right: 20px; /* 距离右侧20px */
  width: 50px; /* 按钮宽度 */
  height: 50px; /* 按钮高度 */
  border: none; /* 移除边框 */
  background-color: #007bff; /* 按钮背景色 */
  color: white; /* 按钮文字颜色 */
  border-radius: 50%; /* 圆形按��� */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); /* 按钮阴影 */
  cursor: pointer; /* 鼠标样式 */
  display: flex; /* 内容居中对齐 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  font-size: 20px; /* 图标字体大小 */
  transition: background-color 0.3s ease, transform 0.2s ease; /* 动画过渡 */
  z-index: 500; /* 设置一个很大的 z-index 确保在最前方 */
}

/* 按钮悬停样式 */
.toggle-button:hover {
  background-color: #0056b3; /* 悬停背景色 */
  transform: scale(1.1); /* 悬停放大效果 */
}

/* 参数面板的容器样式 */
.parameter-container {
  background-color: #f9f9f9; /* 背景色 */
  padding: 20px; /* 内边距 */
  border-radius: 8px; /* 圆角 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); /* 阴影效果 */
  transition: max-height 0.3s ease, opacity 0.3s ease; /* 展开收起动画 */
  overflow: hidden; /* 防止内容溢出 */
}

/* 参数板标题样式 */
.parameter-title {
  font-size: 18px; /* 字体大小 */
  margin-bottom: 20px; /* 下边距 */
  font-weight: bold; /* 加粗字体 */
  text-align: left; /* 左对齐 */
}

/* 参数面板行样式 */
.parameter-row {
  display: flex; /* 横向排列 */
  flex-wrap: wrap; /* 宽度不足时换行 */
  gap: 20px; /* 控制每个参数项之间的间距 */
}

/* 参数项样式 */
.parameter-item {
  display: flex; /* 内部内容横向排列 */
  align-items: center; /* 垂直居中 */
  white-space: nowrap; /* 防止文字换行 */
  gap: 10px; /* 控制标签和输入框之间的间距 */
  min-width: 200px; /* 每个参数项的最小宽度 */
  flex: 1 1 20%; /* 参数项宽度自适应，占20%可用空间 */
  box-sizing: border-box; /* 包括内边距和边框的宽度计算 */
}

/* 参数项标签式 */
.parameter-item label {
  font-size: 14px; /* 标签字体大小 */
  font-weight: 500; /* 标签字体权重 */
}

/* 参数项输入框和选择框样式 */
.parameter-item input,
.parameter-item select {
  flex: 1; /* 输入框和下拉框占据剩余空间 */
  padding: 6px 10px; /* 内边距 */
  border: 1px solid #ddd; /* 边框样式 */
  border-radius: 4px; /* 圆角边框 */
  font-size: 14px; /* 字体大小 */
  min-width: 100px; /* 小宽度 */
  max-width: 300px; /* 大宽度 */
  overflow: hidden; /* 止内容溢出 */
  text-overflow: ellipsis; /* 溢出显示省略号 */
}

/* 面板展开/收起动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease; /* 动画效果 */
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0; /* 起始/结束透明度 */
  transform: translateY(10px); /* 起始/���束位置偏移 */
}

.main-content {
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
  width: 100%; /* 滑块宽度与图表一致 */
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
</style>



<script>
import * as echarts from 'echarts';
import axios from 'axios';
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "langchain/prompts";
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt();

export default {
  name: 'DeviceControlApp',
  data() {
    return {
      isParameterPanelVisible: true, // 参数面板的显示状态
      devices: [
        { id: 'F001', name: '风压',available: false },
        { id: '4787BE3A', name: '综合楼05',available: false },
        { id: '8850A7D7', name: '综合楼04',available: false },
        { id: '8361D7CD', name: '综合楼03',available: false },
        { id: '612B04ED', name: '综合楼02',available: false },
        { id: 'E884C99D', name: '综合楼01',available: false },
        { id: 'E43AC643', name: '安楼06',available: false },
        { id: '29FA1867', name: '安楼05',available: false },
        { id: '87C3D4E4', name: '安楼04',available: true },
        { id: '9A0D1958', name: '安楼03',available: true },
        { id: 'F853ED49', name: '安楼02',available: true },
        { id: 'A77C5238', name: '安楼01',available: false},
      ],
      showDeviceControl: false,
      xAxisChart: null,
      yAxisChart: null,
      zAxisChart: null,
      selectedTimeScale: 'second',
      selectedDirection: 'x',
      yAxisZoom: '2%',
      limitSetting: '10',
      gainFactor: '1',
      deviceSearch: '',
      timeScales: {
        second: 60,
        minute: 3600,
        day: 86400
      },
      chartData: {
  second: {
    x: { times: [], values: [] },
    y: { times: [], values: [] },
    z: { times: [], values: [] }
  },
  minute: {
    x: { times: [], values: [] },
    y: { times: [], values: [] },
    z: { times: [], values: [] }
  },
  day: {
    x: { times: [], values: [] },
    y: { times: [], values: [] },
    z: { times: [], values: [] }
  }
},
      device: '9A0D1958',
      channel: '0',
      updateInterval: null,
      isLoading: false ,
      xOffset: 0,  // X偏移
      yOffset: 0,  // Y偏移
      zOffset: 0,   // Z偏移
      showAssistant: false, // 控制助手显示/隐藏
      userInput: '', // 用户输入
      chatHistory: [], // 聊天历史
      isGeneratingReport: false, // 报告生成状态
      chatModel: null, // 添加 chatModel 属性
    };
  },
  computed: {
    filteredDevices() {
      if (!this.deviceSearch) return this.devices;
      return this.devices.filter(device => 
        device.name.toLowerCase().includes(this.deviceSearch.toLowerCase()) ||
        device.id.toLowerCase().includes(this.deviceSearch.toLowerCase())
      );
    }
  },
  methods: {
    toggleParameterPanel() {
      this.isParameterPanelVisible = !this.isParameterPanelVisible;
    },
    changeTimeScale() {
      console.log(`时间刻度已更改为: ${this.selectedTimeScale}`);
    },

 async sendAlert() {
    try {
      // 发送报警邮件
      await axios.post("http://localhost:3001/api/alert", {
        alertMessage: this.alertMessage,
      });
      console.log("报邮件已发送");
    } catch (error) {
      console.error("邮件发送失败：", error);
    }

    const smsParams = {
      phoneNumber: '19915030933', // 收件人手机号
      signName: '幕墙震动检测',    // 短信签名
      templateCode: 'SMS_475240186', // 短信模板 ID
      templateParam: { magnitude: this.newData.toFixed(5) }, // 短信模板参数
    };

    try {
      // 发送报警短信
      await axios.post("http://localhost:3001/api/send_sms", smsParams);
      console.log("短信已送");
    } catch (error) {
      console.error("短信发送失败：", error);
    }
  },




  async getSecondData() {
  try {
    const response = await axios.get('http://localhost:8080/get_second_data', {
      params: {
        device: this.device,
        channel: this.channel,
        num: this.num || 360  // 使用默认的 num 或传入的值
      }
    });
    if (response.data.status === 'success' && response.data.data) {
      const { x, y, z } = response.data.data;

      // 处理 x 轴数据
      this.chartData.second.x.times = x.map(item => item[0]); // 提取时间
      this.chartData.second.x.values = x.map(item => item[1]); // 提取数值

      // 处理 y 轴数据
      this.chartData.second.y.times = y.map(item => item[0]); // 提取时间
      this.chartData.second.y.values = y.map(item => item[1]); // 提取数值

      // 处理 z 轴数据
      this.chartData.second.z.times = z.map(item => item[0]); // 提取时间
      this.chartData.second.z.values = z.map(item => item[1]); // 提取数值
    }
    this.updateCharts();
  } catch (error) {
    console.error('Error fetching second data:', error);
  }
},

async getMinuteData() {
  try {
    const response = await axios.get('http://localhost:8080/get_minute_data', {
      params: {
        device: this.device,
        channel: this.channel,
        num: this.num || 60  // 使用默认的 num 或传入的值
      }
    });
    if (response.data.status === 'success' && response.data.data) {
      const { x, y, z } = response.data.data;

      // 处理 minute 数据
      this.chartData.minute.x.times = x.map(item => item[0]); // 提取时间
      this.chartData.minute.x.values = x.map(item => item[1]); // 提取数值

      this.chartData.minute.y.times = y.map(item => item[0]); // 提取时间
      this.chartData.minute.y.values = y.map(item => item[1]); // 提取数值

      this.chartData.minute.z.times = z.map(item => item[0]); // 提取时间
      this.chartData.minute.z.values = z.map(item => item[1]); // 提取数值
    }
    this.updateCharts();
  } catch (error) {
    console.error('Error fetching minute data:', error);
  }
},

async getHourData() {
  try {
    const response = await axios.get('http://localhost:8080/get_hour_data', {
      params: {
        device: this.device,
        channel: this.channel,
        num: this.num || 60  // 使用默认的 num 或传入的值
      }
    });
    if (response.data.status === 'success' && response.data.data) {
      const { x, y, z } = response.data.data;

      // 处理 hour 数据
      this.chartData.day.x.times = x.map(item => item[0]); // 提取时
      this.chartData.day.x.values = x.map(item => item[1]); // 提取数值

      this.chartData.day.y.times = y.map(item => item[0]); // 提取时间
      this.chartData.day.y.values = y.map(item => item[1]); // 提取数值

      this.chartData.day.z.times = z.map(item => item[0]); // 提取时间
      this.chartData.day.z.values = z.map(item => item[1]); // 提取数值
    }
    this.updateCharts();
  } catch (error) {
    console.error('Error fetching hour data:', error);
  }
},

async getDailyData() {
  try {
    const response = await axios.get('http://localhost:8080/get_daily_data', {
      params: {
        device: this.device,
        channel: this.channel,
        num: this.num || 60  // 使用默认的 num 或传入的值
      }
    });
    if (response.data.status === 'success' && response.data.data) {
      const { x, y, z } = response.data.data;

      // 处理 hour 数据
      this.chartData.day.x.times = x.map(item => item[0]); // 提取时间
      this.chartData.day.x.values = x.map(item => item[1]); // 提取数值

      this.chartData.day.y.times = y.map(item => item[0]); // 提取时间
      this.chartData.day.y.values = y.map(item => item[1]); // 提取数值

      this.chartData.day.z.times = z.map(item => item[0]); // 提取时间
      this.chartData.day.z.values = z.map(item => item[1]); // 提取数值
    }
    this.updateCharts();
  } catch (error) {
    console.error('Error fetching hour data:', error);
  }
},










    updateChartScale(axis, scale) {
    const chart = this[`${axis}AxisChart`]; // 获取对应图表实例
    if (chart) {
      const option = chart.getOption();
      const scaleValue = parseFloat(scale);

      // 动态设置Y轴范围：让小值和最大值根据滑杆调整
      option.yAxis[0].min = -scaleValue; // 最小值为负
      option.yAxis[0].max = scaleValue;  // 最大值为正

      chart.setOption(option); // 更新图表配置
    }
  },
  initializeCharts() {
    const baseOption = {
      yAxis: {
        type: 'value',
        min: -0.00001, // 初始最小值
        max: 0.00001,  // 初始最大值
        scale: true
      },
      // 其他配置项...
    };

    // 初始化 X、Y、Z 三个轴的图表
    ['x', 'y', 'z'].forEach(axis => {
      const chart = this[`${axis}AxisChart`];
      if (chart) {
        chart.setOption({
          ...baseOption,
          title: { text: `${axis.toUpperCase()} Axis Data` }
        });
      }
    });
  },
   async fetchData() {
  if (this.isLoading) return;
  this.isLoading = true;

  try {
    const now = new Date();
    const formatDate = (date) => {
      return date.toISOString().replace('T', ' ').substring(0, 19);
    };

    // 准备请求的参数, num=1 表示只获取最新的一条数据
    const params = {
      device: this.device,
      channel: this.channel,
      num: 1,  // 每次请求一条数据
    };

    let response;
    // 根据 selectedTimeScale 决定调用哪个 API 获取数据
    switch (this.selectedTimeScale) {
      case 'SECOND':
        response = await axios.get('http://localhost:8080/get_second_data', { params });
        break;
      case 'MINUTE':
        response = await axios.get('http://localhost:8080/get_minute_data', { params });
        break;
      case 'DAY':
        response = await axios.get('http://localhost:8080/get_daily_data', { params });
        break;
      case 'second':
        response = await axios.get('http://localhost:8080/get_second_data', { params });
        break;
      case 'minute':
        response = await axios.get('http://localhost:8080/get_minute_data', { params });
        break;
      case 'day':
        response = await axios.get('http://localhost:8080/get_daily_data', { params });
        break;
      default:
        console.error('Invalid time scale');
        return;
    }

    console.log('API Response:', response.data);

    if (response.data?.status === 'success' && response.data?.data) {
      const { x, y, z } = response.data.data;

      // 处理 x, y, z 数据，添加最新的一条数据
      ['x', 'y', 'z'].forEach(axis => {
        if (Array.isArray(response.data.data[axis]) && response.data.data[axis].length > 0) {
          const latestData = response.data.data[axis][0]; // 获取最新的一条数据
          const timestamp = latestData[0]; // 间戳
          const value = latestData[1]; // 数据值

          // 加上偏移量
          let adjustedValue = value;
          if (axis === 'x') {
            adjustedValue += parseFloat(this.xOffset);
          } else if (axis === 'y') {
            adjustedValue += parseFloat(this.yOffset);
          } else if (axis === 'z') {
            adjustedValue += parseFloat(this.zOffset);
          }
if (adjustedValue > this.limitSetting) {
  this.alertMessage = `警告：${axis.toUpperCase()}轴的最新数据超过阈值！最新值：${adjustedValue.toFixed(2)}`;
  console.log('警报触发:', this.alertMessage);

  this.sendAlert(); // 调用方法发送邮件和短信
} else {
  this.alertMessage = '';
}
          // 将最新数据添加到对应的图表数据中
          this.chartData[this.selectedTimeScale][axis].times.push(timestamp);
          this.chartData[this.selectedTimeScale][axis].values.push(adjustedValue * parseFloat(this.gainFactor));

          // 持数据点数不超过最点数
          const maxPoints = this.timeScales[this.selectedTimeScale];
          if (this.chartData[this.selectedTimeScale][axis].times.length > maxPoints) {
            this.chartData[this.selectedTimeScale][axis].times.shift(); // 删除最旧的时间
            this.chartData[this.selectedTimeScale][axis].values.shift(); // 删除最旧的值
          }

          
        }
      });

      // 更新图表
      this.updateCharts();
    }
  } catch (error) {
    console.error('获取数据出错:', error);
  } finally {
    this.isLoading = false;
  }
},

    initializeCharts() {
      const chartElements = {
        x: document.getElementById('xAxisChart'),
        y: document.getElementById('yAxisChart'),
        z: document.getElementById('zAxisChart')
      };

      if (!chartElements.x || !chartElements.y || !chartElements.z) {
        console.error('图表容器未找到');
        return;
      }

      this.xAxisChart = echarts.init(chartElements.x);
      this.yAxisChart = echarts.init(chartElements.y);
      this.zAxisChart = echarts.init(chartElements.z);

      const baseOption = {
        backgroundColor: '#ffffff',  // 添加白色背景
        title: {
          left: 'center',
          textStyle: {
            fontSize: 14,
            color: '#333'  // 题文字颜色
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const time = params[0].axisValue;
            const value = params[0].data;
            return `时间：${time}<br/>数值：${value.toFixed(4)}`;
          }
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: [],
          axisLabel: {
            formatter: (value) => {
              const date = new Date(value);
              switch(this.selectedTimeScale) {
                case 'second':
                  return date.toLocaleTimeString('zh-CN');
                case 'minute':
                  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                case 'day':
                  return date.toLocaleDateString('zh-CN');
                default:
                  return value;
              }
            },
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          scale: true,
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [{
      type: 'line',
      data: [],
      smooth: true,
      animation: false,
      markLine: {
        silent: true,
        data: [{
          type: 'max',
          name: '限值',
          yAxis: parseFloat(this.limitSetting),
          lineStyle: {
            color: 'red',
            type: 'dashed'
          },
          label: {
            formatter: `限值: ${this.limitSetting}`
          }
        }]
        }
      }]
      };

      // 设置各个图表
      ['x', 'y', 'z'].forEach(axis => {
        const chart = this[`${axis}AxisChart`];
        if (chart) {
          chart.setOption({
            ...baseOption,
            title: { text: `${axis.toUpperCase()}轴振动数据` }
          });
        }
      });

      // 设置更新间隔
      this.setupUpdateInterval();
    },

    setupUpdateInterval() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }

      const updateFrequency = this.selectedTimeScale === 'second' ? 1000 :
                             this.selectedTimeScale === 'minute' ? 60000 : 
                             3600000;

      this.fetchData(); // 立即获取一次数据
      this.updateInterval = setInterval(() => {
        this.fetchData();
      }, updateFrequency);
    },

    updateCharts() {
  ['x', 'y', 'z'].forEach(axis => {
    const chart = this[`${axis}AxisChart`];
    if (chart) {
       // 调试打印限值
      console.log('限值:', this.limitSetting, '解析后:', parseFloat(this.limitSetting));
      chart.setOption({
        
        xAxis: {
          data: this.chartData[this.selectedTimeScale][axis].times
        },
        series: [{
          data: this.chartData[this.selectedTimeScale][axis].values,
          markLine: {
            symbol: 'none' ,// 取消箭头
            data: [
              {
                       yAxis: parseFloat(this.limitSetting).toFixed(6), // 保留小数点后6位
                lineStyle: {
                  color: 'red',
                  type: 'dashed'
                },
                label: {
                  formatter: `限值: ${this.limitSetting}`
                },
                symbol: 'none' // 取消箭头
              },
              {
                yAxis: (-parseFloat(this.limitSetting)).toFixed(6),
                lineStyle: {
                  color: 'red',
                  type: 'dashed'
                },
                label: {
                  formatter: `限值的相反数: ${-this.limitSetting}`
                },
                symbol: 'none' // 取消箭头
              }
            ]
          }
        }]
      });
    }
  });
},
 // 切换时间刻度时更新数据
  changeTimeScale() {
    // 清空现有数据
    ['x', 'y', 'z'].forEach(axis => {
      this.chartData[this.selectedTimeScale][axis].times = [];
      this.chartData[this.selectedTimeScale][axis].values = [];
    });

    // 根据选择的时间刻度获取数据
    if (this.selectedTimeScale === 'second') {
      this.getSecondData();
    } else if (this.selectedTimeScale === 'minute') {
      this.getMinuteData();
    } else if (this.selectedTimeScale === 'day') {
      this.getDailyData();
    }

    this.setupUpdateInterval();
  },


    updateYAxisScale() {
      const scale = parseFloat(this.yAxisZoom) / 100;
      ['x', 'y', 'z'].forEach(axis => {
        const chart = this[`${axis}AxisChart`];
        if (chart) {
          const option = chart.getOption();
          option.yAxis[0].scale = scale;
          chart.setOption(option);
        }
      });
    },

    updateLimit() {
      this.updateCharts();
    },

    updateGain() {
      // 重新计算所有数据点
      ['x', 'y', 'z'].forEach(axis => {
        this.chartData[axis].values = this.chartData[axis].values.map(
          value => value * parseFloat(this.gainFactor)
        );
      });
      this.updateCharts();
    },

    selectDevice(device) {
      this.device = device.id;
      console.log('选择的设备:', device);
      // 清空现有据并重新开始获取
      // 清空所有时间刻度的数据
  ['second', 'minute', 'day'].forEach(timeScale => {
    ['x', 'y', 'z'].forEach(axis => {
      this.chartData[timeScale][axis] = {
        times: [],
        values: []
      };
    });
  });
      this.changeTimeScale();
    },

    searchDevice() {
      // 搜索功能已通过计算属性 filteredDevices 实现
    },

    resizeCharts() {
      ['x', 'y', 'z'].forEach(axis => {
        this[`${axis}AxisChart`]?.resize();
      });
    },

    async initChatModel() {
      try {
        const { ChatOpenAI } = await import("@langchain/openai");  // 确保正确导入
        
        this.chatModel = new ChatOpenAI({
          openAIApiKey: "sk-Q012GL505WbC7hbQJeyr7zExYW8p9vt3sn4isE5sYiN1EgWS",
          temperature: 0.7,
          modelName: "gpt-3.5-turbo",
          configuration: {
            baseURL: "https://api.chatanywhere.org/v1",
            defaultHeaders: {
              'Content-Type': 'application/json',
            }
          }
        });

        // 测试连接
        console.log('ChatModel 初始化成功');
        
      } catch (error) {
        console.error('ChatModel 初始化失败:', error);
      }
    },
    
    toggleAssistant() {
      this.showAssistant = !this.showAssistant;
    },
    
    // 新增：获取当前数据状态
    getCurrentDataStatus() {
      const getRecentData = (axis) => {
        const values = this.chartData[this.selectedTimeScale][axis].values;
        const times = this.chartData[this.selectedTimeScale][axis].times;
        const current = values[values.length - 1] || 0;
        const average = values.reduce((a, b) => a + b, 0) / values.length;

        return {
          current: current.toFixed(6),
          average: average.toFixed(6),
          trend: this.analyzeTrend(values),
          lastUpdateTime: times[times.length - 1]
        };
      };

      return {
        x: getRecentData('x'),
        y: getRecentData('y'),
        z: getRecentData('z')
      };
    },

    // 新增：分析数据趋势
    analyzeTrend(values) {
      if (values.length < 2) return '数据不足';
      
      const changes = [];
      for (let i = 1; i < values.length; i++) {
        changes.push(values[i] - values[i-1]);
      }
      
      const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
      const variance = changes.reduce((a, b) => a + Math.pow(b - avgChange, 2), 0) / changes.length;
      
      if (Math.abs(avgChange) < 0.001) {
        return variance < 0.0001 ? '稳��' : '波动';
      }
      
      if (avgChange > 0) {
        return variance < 0.0001 ? '稳定上升' : '波动上升';
      }
      
      return variance < 0.0001 ? '稳定下降' : '波动下降';
    },

    // 修改发送消息方法
    async sendMessage() {
      if (!this.userInput.trim()) return;
      
      // 将用户输入添加到聊天历史
      this.chatHistory.push({
        role: 'user',
        content: this.userInput.trim()
      });

      const userInput = this.userInput.trim();
      this.userInput = ''; // 清空输入框

      // 特殊处理"生成报告"的请求
      if (userInput.toLowerCase() === '生成报告') {
        try {
          const report = await this.generateReport();
          this.chatHistory.push({
            role: 'assistant',
            content: report
          });
        } catch (error) {
          console.error('报告生成错误:', error);
          this.chatHistory.push({
            role: 'assistant',
            content: '报告生成失败，请稍后重试。'
          });
        }
        return;
      }

      // 处理其他消息
      try {
        if (!this.chatModel) {
          throw new Error('AI模型未初始化');
        }

        const response = await this.chatModel.invoke(userInput);
        console.log('AI响应:', response);

        this.chatHistory.push({
          role: 'assistant',
          content: response.content || response
        });

      } catch (error) {
        console.error('消息处理错误:', error);
        this.chatHistory.push({
          role: 'assistant',
          content: '处理请求时出现错误，请稍后重试。错误信息：' + error.message
        });
      }
    },

    async generateReport() {
      try {
        const reportData = {
          timestamp: new Date().toLocaleString('zh-CN'),
          device: this.device,
          timeScale: this.selectedTimeScale,
          data: this.getCurrentDataStatus(),
          statistics: this.calculateStatistics(),
          alerts: this.checkAlerts()
        };

        const analysisPrompt = `
          请根据以下振动监测数据生成专业的分析报告：

          监测时间：${reportData.timestamp}
          设备ID：${reportData.device}
          时间刻度：${reportData.timeScale}

          当前数据状态：
          X轴：${JSON.stringify(reportData.data.x, null, 2)}
          Y轴：${JSON.stringify(reportData.data.y, null, 2)}
          Z轴：${JSON.stringify(reportData.data.z, null, 2)}

          统计数据：
          ${JSON.stringify(reportData.statistics, null, 2)}

          预警信息：
          ${reportData.alerts}

          请提供以下分析（使用markdown格式）：
          1. 数据趋势分析
          2. 异常状态检测
          3. 设备运行状态评估
          4. 预警信息分析
          5. 建议措施
        `;

        const response = await this.chatModel.invoke(analysisPrompt);
        
        return response.content || response;

      } catch (error) {
        console.error('报告生成错误:', error);
        throw error;
      }
    },

    // 新增：计算统计数据
    calculateStatistics() {
      try {
        const calculateStats = (values) => {
          if (!Array.isArray(values) || values.length === 0) {
            return { max: '0', min: '0', avg: '0', std: '0' };
          }

          const max = Math.max(...values);
          const min = Math.min(...values);
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const std = Math.sqrt(
            values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length
          );
          
          return {
            max: max.toFixed(6),
            min: min.toFixed(6),
            avg: avg.toFixed(6),
            std: std.toFixed(6)
          };
        };

        const getAxisValues = (axis) => {
          const axisData = this.chartData[this.selectedTimeScale]?.[axis];
          if (!axisData || !Array.isArray(axisData.values)) {
            console.warn(`未找到${axis}轴数据或数据格式不正确`);
            return [];
          }
          return axisData.values;
        };

        return {
          x: calculateStats(getAxisValues('x')),
          y: calculateStats(getAxisValues('y')),
          z: calculateStats(getAxisValues('z'))
        };
      } catch (error) {
        console.error('计算统计数据失败:', error);
        return {
          x: { max: '0', min: '0', avg: '0', std: '0' },
          y: { max: '0', min: '0', avg: '0', std: '0' },
          z: { max: '0', min: '0', avg: '0', std: '0' }
        };
      }
    },

    // 新：检查��警信息
    checkAlerts() {
      const alerts = [];
      const limit = parseFloat(this.limitSetting);
      const currentData = this.getCurrentDataStatus();

      ['x', 'y', 'z'].forEach(axis => {
        const current = parseFloat(currentData[axis].current);
        if (current > limit * 0.8) {
          alerts.push(`${axis.toUpperCase()}轴振动值(${current})接近限值(${limit})`);
        }
        if (current > limit) {
          alerts.push(`警告：${axis.toUpperCase()}轴振动值(${current})超过限值(${limit})`);
        }
      });

      return alerts.length > 0 ? alerts.join('\n') : '无预警信息';
    },

    // 新增：格式化报告模板
    async formatReport(template, data) {
      return template.replace(
        /{(\w+\.?\w+\.?\w+)}/g,
        function(match, key) {
          return key.split('.').reduce((obj, k) => obj[k], data) || match;
        }
      );
    },

    // 修改消息展示组件，添加 markdown 渲染
    renderMessage(message) {
      if (message.content.includes('# ')) {
        // 如果包含 markdown 标记，则进行渲染
        return md.render(message.content);
      }
      return message.content;
    }
  },
  
  async mounted() {
    this.$nextTick(async () => {  // 修改为 async
      this.initializeCharts();
      this.changeTimeScale();
      window.addEventListener('resize', this.resizeCharts);
      await this.initChatModel();  // 确保在组件挂载时初始化 chatModel
    });
  },

  beforeDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    window.removeEventListener('resize', this.resizeCharts);
    ['x', 'y', 'z'].forEach(axis => {
      this[`${axis}AxisChart`]?.dispose();
    });
    
  }
};
</script>