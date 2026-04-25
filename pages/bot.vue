<template>
    
  <div class="chat-container">
    <!-- 快捷操作按钮区 --> <el-button type="primary" @click="backToMain" style="position: absolute; right: 0; top: 0;">返回主页</el-button>
    <div class="quick-actions">
      <el-button type="primary" @click="showAnalysisDialog">
        <el-icon><DataAnalysis /></el-icon>
        数据分析
      </el-button>
    </div>

    <!-- 对话区域 -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" 
           :key="index"
           :class="['message', message.role]">
        <div class="message-content">
          <template v-if="message.type === 'analysis'">
            <div class="analysis-report">
              <h4>数据分析报告</h4>
              <div v-html="message.content"></div>
            </div>
          </template>
          <template v-else>
            {{ message.content }}
          </template>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <el-input 
        v-model="userInput"
        placeholder="请输入您的问题..."
        :disabled="loading"
        @keyup.enter="sendMessage"
      >
        <template #append>
          <el-button @click="sendMessage" :loading="loading">
            发送
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 数据分析弹窗 -->
    <el-dialog 
      v-model="showDialog" 
      title="数据分析设置"
      width="500px"
      destroy-on-close
    >
      <el-form :model="analysisForm" label-width="100px">
        <el-form-item label="选择设备">
          <el-select 
            v-model="analysisForm.device" 
            placeholder="请选择设备"
          >
            <el-option
              v-for="device in devices"
              :key="device.deviceId"
              :label="device.deviceName"
              :value="device.deviceId"
              :disabled="device.disabled"
            >
              <template #default>
                <div class="flex items-center">
                  <span 
                    :class="[
                      device.online ? 'bg-green-400' : 'bg-gray-200',
                      'inline-block h-2 w-2 mr-2 rounded-full'
                    ]"
                  />
                  {{ device.deviceName }}
                  <span v-if="device.disabled" class="text-red-500 ml-2">(离线)</span>
                </div>
              </template>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="分析尺度">
          <el-select v-model="analysisForm.timeScale" placeholder="请选择分析尺度">
            <el-option label="最近1小时" value="hour" />
            <el-option label="最近1天" value="day" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="generateReport" :loading="loading">
            生成报告
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>

const router = useRouter();
import { ChatOpenAI } from "@langchain/openai";
import {useRouter} from "vue-router";
import axios from 'axios';
import { DataAnalysis } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it';
import { ref, onMounted, onBeforeUnmount } from 'vue';
const backToMain = () => {
  router.push("/subindex");
};
const md = new MarkdownIt();

export default {
  setup() {
    const router = useRouter();
    const backToMain = () => {
      router.push("/subindex");
    };

    return {
      backToMain
    };
  },
  components: {
    DataAnalysis
  },
  
  data() {
    return {
      chatModel: null,
      messages: [],
      userInput: '',
      loading: false,
      showDialog: false,
      deviceList: [
        { device_id: '29FA1867', device_name: '安楼05' },
        { device_id: '4787BE3A', device_name: '综合楼05' },
        { device_id: '612B04ED', device_name: '综合楼02' },
        { device_id: '8361D7CD', device_name: '综合楼03' },
        { device_id: '87C3D4E4', device_name: '安楼04' },
        { device_id: '8850A7D7', device_name: '综合楼04' },
        { device_id: '9A0D1958', device_name: '安楼03' },
        { device_id: 'A77C5238', device_name: '安楼01' },
        { device_id: 'E43AC643', device_name: '安楼06' },
        { device_id: 'E884C99D', device_name: '综01' },
        { device_id: 'F001', device_name: '风压' },
        { device_id: 'F853ED49', device_name: '安楼02' }
      ],
      analysisForm: {
        device: '',
        timeScale: 'hour'
      },
      socket1: null,
      devices: [], // 存储设备状态
    }
  },

  async created() {
    await this.initChatModel();
    this.initWebSocket();
  },

  beforeUnmount() {
    // 组件销毁前关闭 WebSocket 连接
    if (this.socket1) {
      this.socket1.close();
    }
  },

  methods: {

    async initChatModel() {
      try {
        this.chatModel = new ChatOpenAI({
          openAIApiKey: "sk-Q012GL505WbC7hbQJeyr7zExYW8p9vt3sn4isE5sYiN1EgWS",
          temperature: 0.7,
          modelName: "gpt-3.5-turbo",
          configuration: {
            basePath: "https://api.chatanywhere.tech/v1",
            defaultHeaders: {
              'Content-Type': 'application/json',
            }
          }
        });
      } catch (error) {
        console.error('初始化聊天模型失败:', error);
        this.$message.error('初始化聊天模型失败，请检查配置');
      }
    },

    showAnalysisDialog() {
      this.showDialog = true;
    },

    async sendMessage() {
      if (!this.userInput.trim() || this.loading) return;
      
      this.loading = true;
      try {
        // 添加用户消息
        this.messages.push({
          role: 'user',
          content: this.userInput
        });

        // 修改这里的调用方式
        const response = await this.chatModel.invoke(this.userInput);
        // 或者使用以下格式
        /*
        const response = await this.chatModel.call([
          { type: "system", content: "你是一个智能助手。" },  // 可统消息
          { type: "human", content: this.userInput }
        ]);
        */

        // 添加AI回复
        this.messages.push({
          role: 'assistant',
          content: response.content || response
        });

        this.userInput = '';
        this.scrollToBottom();
      } catch (error) {
        console.error('发送消息失败:', error);
        this.messages.push({
          role: 'assistant',
          content: '抱歉,出现了一些错误,请稍后重试。'
        });
      } finally {
        this.loading = false;
      }
    },

    async generateReport() {
      this.loading = true;
      try {
        const numMap = {
          minute: 60,
          hour: 3600,
          day: 86400
        };
        
        const data = await this.fetchData(
          this.analysisForm.device,
          numMap[this.analysisForm.timeScale]
        );
        
        if (data) {
          const analysis = await this.basicAnalysis(data);
          const report = this.formatAnalysisResult(analysis);
          
          this.messages.push({
            role: 'assistant',
            type: 'analysis',
            content: report
          });

          this.showDialog = false;
          this.scrollToBottom();
        }
      } catch (error) {
        console.error('生成报告失败:', error);
        this.$message.error('生成报告失败,请稍后重试');
      } finally {
        this.loading = false;
      }
    },

    async fetchData(device, num) {
      try {
        const response = await axios.get('http://8.153.161.229:8009/data/get_minute_data', {
          params: { 
            device,
            num
          }
        });
        
        if (response.data.status === 'success' && response.data.data) {
          return response.data.data;
        }
        throw new Error('获取数据失败');
      } catch (error) {
        console.error('获取数据失败:', error);
        throw error;
      }
    },

    async basicAnalysis(data) {
      try {
        // 确保数据存在且格式正确
        if (!data || !data.x || !Array.isArray(data.x)) {
          throw new Error('数据格式不正确');
        }

        // 提取数值并过滤掉无效值
        const xValues = data.x.map(item => item[1]).filter(val => !isNaN(val) && val !== null);
        const yValues = data.y.map(item => item[1]).filter(val => !isNaN(val) && val !== null);
        const zValues = data.z.map(item => item[1]).filter(val => !isNaN(val) && val !== null);

        // 检查是否有有效数据
        if (!xValues.length || !yValues.length || !zValues.length) {
          throw new Error('没有有效的数据点');
        }

        // 计算统计值，并确保返回数字类型
        const calculateStats = (values) => ({
          max: Number(Math.max(...values)) || 0,
          min: Number(Math.min(...values)) || 0,
          avg: Number(values.reduce((sum, val) => sum + val, 0) / values.length) || 0
        });

        return {
          x: calculateStats(xValues),
          y: calculateStats(yValues),
          z: calculateStats(zValues)
        };
      } catch (error) {
        console.error('数据分析错误:', error);
        throw new Error('数据分析失败: ' + error.message);
      }
    },

    formatAnalysisResult(analysis) {
      try {
        if (!analysis) {
          throw new Error('分析结果为空');
        }

        const formatNumber = (num) => {
          try {
            return num.toExponential(6);
          } catch (error) {
            return '无效数据';
          }
        };

        const calculateAmplitude = (max, min) => {
          return Math.abs(max - min).toExponential(6);
        };

        const getFluctuationLevel = (amplitude) => {
          const amp = Math.abs(Number(amplitude));
          if (amp > 0.1) return '剧烈';
          if (amp > 0.05) return '中等';
          return '平稳';
        };

        // 新增：获取振动状态评估
        const getVibrationStatus = (amplitude) => {
          const amp = Math.abs(Number(amplitude));
          if (amp > 0.2) return '⚠️ 需要立即关注';
          if (amp > 0.1) return '⚡ 需要定期监控';
          if (amp > 0.05) return '📊 建议观察';
          return '✅ 状态正常';
        };

        // 新增：获取建议措施
        const getRecommendations = (xAmp, yAmp, zAmp) => {
          const recommendations = [];
          const maxAmp = Math.max(xAmp, yAmp, zAmp);
          
          if (maxAmp > 0.2) {
            recommendations.push('- 建议立即进行设备检查和维护');
            recommendations.push('- 考虑临时降低设备运行负载');
            recommendations.push('- 增加监测频率至每小时一次');
          } else if (maxAmp > 0.1) {
            recommendations.push('- 建议在下次维护周期进行详细检查');
            recommendations.push('- 增加日常巡检频率');
            recommendations.push('- 记录振动变化趋势');
          } else if (maxAmp > 0.05) {
            recommendations.push('- 保持正常监测频率');
            recommendations.push('- 做好数据记录和趋势分析');
          } else {
            recommendations.push('- 维持当前运行状态');
            recommendations.push('- 继续执行常规维护计划');
          }
          return recommendations.join('\n');
        };

        const now = new Date().toLocaleString();
        const xAmplitude = calculateAmplitude(analysis.x.max, analysis.x.min);
        const yAmplitude = calculateAmplitude(analysis.y.max, analysis.y.min);
        const zAmplitude = calculateAmplitude(analysis.z.max, analysis.z.min);

        const markdownText = `
# 振动数据分析报告

## 📊 报告概要
- **分析时间**: ${now}
- **数据来源**: ${this.deviceList.find(d => d.device_id === this.analysisForm.device)?.device_name || '未知设备'}
- **采样周期**: ${this.analysisForm.timeScale === 'minute' ? '最近1分钟' : 
                this.analysisForm.timeScale === 'hour' ? '最近1小时' : '最近1天'}
- **分析状态**: ${Math.max(Number(xAmplitude), Number(yAmplitude), Number(zAmplitude)) > 0.1 ? '🚨 需要关注' : '✅ 正常'}

## 📈 X轴振动分析
- **最大值**: ${formatNumber(analysis.x.max)}
- **最小值**: ${formatNumber(analysis.x.min)}
- **平均值**: ${formatNumber(analysis.x.avg)}
- **振幅**: ${xAmplitude}
- **波动评估**: ${getFluctuationLevel(xAmplitude)}
- **状态**: ${getVibrationStatus(xAmplitude)}

## 📉 Y轴振动分析
- **最大值**: ${formatNumber(analysis.y.max)}
- **最小值**: ${formatNumber(analysis.y.min)}
- **平均值**: ${formatNumber(analysis.y.avg)}
- **振幅**: ${yAmplitude}
- **波动评估**: ${getFluctuationLevel(yAmplitude)}
- **状态**: ${getVibrationStatus(yAmplitude)}

## 📊 Z轴振动分析
- **最大值**: ${formatNumber(analysis.z.max)}
- **最小值**: ${formatNumber(analysis.z.min)}
- **平均值**: ${formatNumber(analysis.z.avg)}
- **振幅**: ${zAmplitude}
- **波动评估**: ${getFluctuationLevel(zAmplitude)}
- **状态**: ${getVibrationStatus(zAmplitude)}

## 💡 综合评估
### 振动状态
- X轴: ${getFluctuationLevel(xAmplitude)} (${getVibrationStatus(xAmplitude)})
- Y轴: ${getFluctuationLevel(yAmplitude)} (${getVibrationStatus(yAmplitude)})
- Z轴: ${getFluctuationLevel(zAmplitude)} (${getVibrationStatus(zAmplitude)})

### 数据特征
- **主要振动方向**: ${[
    {axis: 'X', amp: Number(xAmplitude)},
    {axis: 'Y', amp: Number(yAmplitude)},
    {axis: 'Z', amp: Number(zAmplitude)}
  ].sort((a, b) => b.amp - a.amp)[0].axis}轴
- **振动强度**: ${Math.max(Number(xAmplitude), Number(yAmplitude), Number(zAmplitude)).toExponential(6)}
- **整体评价**: ${
    Math.max(Number(xAmplitude), Number(yAmplitude), Number(zAmplitude)) > 0.1 ? 
    '⚠️ 设备振动超出正常范围' : 
    '✅ 设备运行正常'
  }

## 🔍 建议措施
${getRecommendations(Number(xAmplitude), Number(yAmplitude), Number(zAmplitude))}

## 📌 注意事项
- 本报告基于实时数据分析，仅供参考
- 建议结合历史数据和现场情况综合判断
- 如发现异常，请及时联系相关技术人员
        `;

        return `<div class="analysis-data">${md.render(markdownText)}</div>`;
      } catch (error) {
        console.error('格式化分析结果错误:', error);
        return `
          <div class="analysis-data">
            <p>分析结果格式化失败: ${error.message}</p>
          </div>
        `;
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        container.scrollTop = container.scrollHeight;
      });
    },

    initWebSocket() {
      const websocketUrl = 'wss://digetech.cn:8771/websocket/user_58';
      this.socket1 = new WebSocket(websocketUrl);
      
      this.socket1.onopen = () => {
        console.log('WebSocket connection opened');
        // 发送设备状态请求
        const request1 = {
          code: 2,
          data: this.deviceList.map(device => device.device_id),
          key: 'qiushangzhou852'
        };
        this.socket1.send(JSON.stringify(request1));
      };

      this.socket1.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.code === 20001 && message.message === '设备状态') {
          // 更新设备状态
          this.devices = Object.entries(message.data).map(([key, value]) => ({
            deviceId: key,
            disabled: value !== 1,
            online: value === 1
          }));

          // 添加设备名称
          this.devices.forEach(device => {
            const deviceInfo = this.deviceList.find(d => d.device_id === device.deviceId);
            if (deviceInfo) {
              device.deviceName = deviceInfo.device_name;
            }
          });
        }
      };

      this.socket1.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    },
  }
}
</script>

<style>
.chat-container {
  height: 100vh;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.quick-actions {
  padding: 10px;
  border-bottom: 1px solid #eee;
  background: #fff;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin: 10px 0;
  max-width: 100%;
}

.message.user {
  margin-left: auto;
}

.message.assistant {
  margin-right: auto;
}

.message-content {
  padding: 12px 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.user .message-content {
  background: #95ec69;
}

.analysis-report {
  
  width: 100%; /* 设置相对宽度 */
}

.analysis-report h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #409EFF;
}

.analysis-data h5 {
  margin: 10px 0;
  color: #606266;
}

.analysis-data p {
  margin: 5px 0;
  color: #303133;
}

.input-area {
  padding: 20px;
  background: #fff;
  border-top: 1px solid #eee;
}

:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-button) {
  border: none;
  margin: 0;
}

.analysis-data {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  line-height: 1.6;
  color: #2c3e50;
}

.analysis-data h1 {
  font-size: 24px;
  color: #1a73e8;
  margin: 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #1a73e8;
}

.analysis-data h2 {
  font-size: 20px;
  color: #2c3e50;
  margin: 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #eaecef;
}

.analysis-data ul {
  list-style-type: none;
  padding-left: 0;
}

.analysis-data li {
  margin: 8px 0;
}

/* Markdown 列表项样式 */
.analysis-data p {
  margin: 8px 0;
  line-height: 1.6;
}

/* 加粗文本样式 */
.analysis-data strong {
  color: #1a73e8;
  font-weight: 600;
}

/* 分隔线样式 */
.analysis-data hr {
  height: 1px;
  background-color: #eaecef;
  border: none;
  margin: 16px 0;
}

/* 代码块样式 */
.analysis-data code {
  background-color: #f6f8fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

/* 引用块样式 */
.analysis-data blockquote {
  margin: 16px 0;
  padding: 0 16px;
  color: #6a737d;
  border-left: 4px solid #dfe2e5;
}

.analysis-report {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 20px;
  margin: 10px 0;
}

/* 修复表情符号显示 */
.analysis-data {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Segoe UI Emoji', 'Segoe UI Symbol', 
               'Apple Color Emoji', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 添加设备状态指示器样式 */
.device-status-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}
</style>