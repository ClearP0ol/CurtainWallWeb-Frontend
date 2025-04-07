<template>
  <div style="position: fixed; right: 10px; top: 15px; z-index: 1000;">
    <el-button type="primary" @click="backToMain" style="position: absolute; right: 0; top: 0;">返回主页</el-button>
  </div>
  <UDashboardToolbar>
    <template #left>
      <el-cascader
        v-model="selectedDevicePath"
        :options="cascaderDevices"
        :props="cascaderProps"
        placeholder="选择设备"
        class="min-w-[150px]"
        @change="handleDeviceChange"
      >
        <template #default="{ node, data }: { node: any; data: CascadeIrOption }">
          <span>
            <span
              :class="[
                data.online ? 'bg-green-400' : 'bg-gray-200',
                'inline-block h-2 w-2 flex-shrink-0 rounded-full mr-2'
              ]"
              aria-hidden="true"
            />
            {{ data.label }}
          </span>
        </template>
      </el-cascader>

      <el-select v-model="dataSource" placeholder="请选择数据粒度" class="ml-4 min-w-[180px]">
        <el-option label="秒级数据" value="websocket"></el-option>
        <el-option label="分钟级数据" value="api_minute"></el-option>
        <el-option label="小时级数据" value="api_hour"></el-option>
        <el-option label="天级数据" value="api_day"></el-option>
        <el-option label="月级数据" value="api_month"></el-option>
        <el-option label="年级数据" value="api_year"></el-option>
      </el-select>
    </template>
  </UDashboardToolbar>

  <UDashboardCard class="overflow-y-auto">
    <div id="main" style="height: 400px;" class="rounded-lg border border-gray-300"></div>
    <div id="main2" style="height: 400px;" class="rounded-lg border border-gray-300"></div>
  </UDashboardCard>

</template>

<script setup lang="ts">
import {onMounted, ref, watch, computed} from 'vue';
import * as echarts from 'echarts';
import {useRouter} from "vue-router";
import axios from 'axios';
import type { CascaderValue } from 'element-plus';

const API_BASE_URL = 'http://110.42.214.164:8009';
const dataSource = ref<'websocket' | 'api_minute' | 'api_hour' | 'api_day' | 'api_month' | 'api_year'>('websocket'); // 默认使用 WebSocket
// 定义响应式变量存储阈值
const upperThreshold = ref(0.0);
const lowerThreshold = ref(0.0);
const x_offset = ref(0.0);
const y_offset = ref(0.0);
const z_offset = ref(0.0);
const emailThreshold =ref(0.0);
const smsThreshold = ref(0.0);

// 获取阈值的函数
const getThresholds = async (type: 'up' | 'down' | 'x_offset' | 'y_offset' | 'z_offset' | 'message_limit' | 'email_limit') => {
  try {
    // 获取上阈值或下阈值或偏移量
    const Response = await axios.get(`${API_BASE_URL}/data/get_threshold_or_offset`, {
      params: {
        device: selectedDevice.value.deviceId,
        type: type
      }
    });
    if (Response.data.status === 'success') {
      if(type === 'up'){
        upperThreshold.value = Response.data.data.value;
      }
      else if(type === 'down'){
        lowerThreshold.value = Response.data.data.value;
      }
      else if(type === 'x_offset'){
        x_offset.value = Response.data.data.value;
      }
      else if(type === 'y_offset'){
        y_offset.value = Response.data.data.value;
      }
      else if(type === 'z_offset'){
        z_offset.value = Response.data.data.value;
      }
      else if(type === 'message_limit')
      {
        smsThreshold.value = Response.data.data.value;
      }
      else if(type === 'email_limit')
      {
        emailThreshold.value = Response.data.data.value;
      }
    }
  } catch (error) {
    console.error('获取阈值失败:', error);
  }
};
const drawTimeChart1 = (chartData: any) => {
  const x_axis = chartData.x.times;
  const yData = {
    x: chartData.x.values.map((v: number) => v  + x_offset.value),
    y: chartData.y.values.map((v: number) => v  + y_offset.value),
    z: chartData.z.values.map((v: number) => v  + z_offset.value)
  };

  // 基础数据系列
  let series = Object.keys(yData).map(name => ({
    name,
    type: 'line',
    data: yData[name as keyof typeof yData],
    smooth: false,
    symbol: 'none',
    markLine: {
      symbol: ['none', 'none'],  // 设置两端都不显示箭头
      data: [
        // 添加上限阈值线
        {
          name: '上限阈值',
          yAxis: upperThreshold.value,  // 设置上限阈值
          label: {
            position: 'insideEndTop',
            formatter: `上限: ${upperThreshold.value}`,
            color: '#ff4d4d'
          },
          lineStyle: {
            color: '#ff4d4d',
            type: 'dashed'
          }
        },
        // 添加下限阈值线
        {
          name: '下限阈值',
          yAxis: lowerThreshold.value,  // 设置下限阈值
          label: {
            position: 'insideEndBottom',
            formatter: `下限: ${lowerThreshold.value}`,
            color: '#ff4d4d'
          },

          lineStyle: {
            color: '#ff4d4d',
            type: 'dashed'
          }
        }
      ],
      itemStyle: {
        normal: {
          lineStyle: {
            color: '#ff0000',
          }
        }
      }
    }
  }));

  const option = {
    title: {
      text: `时程曲线：${selectedDevice.value.deviceName}`
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['x', 'y', 'z']
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      show: true,
      feature: {
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: x_axis
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: {
        formatter: function(value: number) {
          return (value).toFixed(6) + ' gal';  // 显示
        }
      },
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0
      },
      {
        type: 'slider',
        xAxisIndex: 0
      },
      {
        type: 'inside',
        yAxisIndex: 0
      },
      {
        type: 'slider',
        yAxisIndex: 0
      }
    ],
    series
  };

  timeChart.setOption(option);
};


let fetchInterval: ReturnType<typeof setInterval> | null = null;
const maxDataLength = 100;

const accumulatedData = ref({
  x: { times: [] as string[], values: [] as number[] },
  y: { times: [] as string[], values: [] as number[] },
  z: { times: [] as string[], values: [] as number[] }
});

const loadData = async (type: 'daily' | 'minute' | 'hourly' | 'monthly' | 'yearly', numPoints: number) => {
  try {
    const endpoint = type === 'daily' ? 'get_daily_data' : type === 'minute' ? 'get_minute_data' : type === 'hourly' ? 'get_hourly_data' : type === 'monthly' ? 'get_monthly_data' : 'get_yearly_data';
    const response = await axios.get(`${API_BASE_URL}/data/${endpoint}`, {
      params: {
        device: selectedDevice.value.deviceId,
        channel: '0',
        num: numPoints
      }
    });

    console.log("API Response:", response.data);

    if (response.data.status === 'success' && response.data.data) {
      const { x, y, z } = response.data.data;

      accumulatedData.value.x.times = x.map((item: [string, number]) => item[0]);
      accumulatedData.value.x.values = x.map((item: [string, number]) => item[1]);

      accumulatedData.value.y.times = y.map((item: [string, number]) => item[0]);
      accumulatedData.value.y.values = y.map((item: [string, number]) => item[1]);

      accumulatedData.value.z.times = z.map((item: [string, number]) => item[0]);
      accumulatedData.value.z.values = z.map((item: [string, number]) => item[1]);

      console.log("Parsed Chart Data:", accumulatedData.value);

      drawTimeChart1(accumulatedData.value);
    } else {
      console.warn("API returned empty or invalid data");
    }
  } catch (error) {
    console.error("Error loading initial data:", error);
  }
};

// 分别处理邮件和短信告警
// 分别处理邮件和短信告警
const sendEmailAlert = async (value: number, type: string) => {
  const adjustedValue = Math.abs(value);
  if (adjustedValue > emailThreshold.value) {
    try {
      // 修改为后端服务器地址
      await axios.post(`${API_BASE_URL}/data/alert`, {
        alertMessage: `设备${selectedDevice.value.deviceId}检测到异常值：${adjustedValue}`
      });
      console.log("警报邮件已发送");

      // 保存邮件告警记录到数据库
      const messageData = {
        device: selectedDevice.value.deviceId,
        content: `${type}轴检测到异常值：${adjustedValue.toFixed(6)} gal，超过邮件告警阈值${emailThreshold.value}`,
        call_function: 'email',
        severity: adjustedValue > emailThreshold.value * 1.5 ? 'critical' : 'high',
        phone: null,
        email: 'example@email.com'  // 替换为实际的邮箱地址
      };
      await axios.post(`${API_BASE_URL}/data/insert_message`, messageData);
      console.log("邮件告警记录已保存到数据库");
    } catch (error: any) {
      console.error("发送邮件警报失败：", error);
      if (error.response) {
        console.error("错误响应:", error.response.data);
      }
    }
  }
};

const sendSMSAlert = async (value: number, type: string) => {
  const adjustedValue = Math.abs(value);
  if (adjustedValue > smsThreshold.value) {
    try {
      // 修改为后端服务器地址
      await axios.post(`${API_BASE_URL}/data/send_sms`, {
        phoneNumber: '19915030933',
        signName: '幕墙震动检测',
        templateCode: 'SMS_475240186',
        templateParam: {
          magnitude: adjustedValue.toFixed(5)
        }
      });
      console.log("报警短信已发送");

      // 保存短信告警记录到数据库
      const messageData = {
        device: selectedDevice.value.deviceId,
        content: `${type}轴检测到异常值：${adjustedValue.toFixed(6)} gal，超过短信告警阈值${smsThreshold.value}`,
        call_function: 'phone',
        severity: adjustedValue > smsThreshold.value * 1.5 ? 'critical' : 'high',
        phone: '19915030933',
        email: null
      };
      await axios.post(`${API_BASE_URL}/data/insert_message`, messageData);
      console.log("短信告警记录已保存到数据库");
    } catch (error: any) {
      console.error("发送短信警报失败：", error);
      if (error.response) {
        console.error("错误响应:", error.response.data);
      }
    }
  }
};

const fetchLatestData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/data/get_minute_data`, {
      params: {
        device: selectedDevice.value.deviceId,
        channel: '0',
        num: 1
      }
    });
    
    if (response.data.status === 'success' && response.data.data) {
      const { x, y, z } = response.data.data;

      // 检查是否有新数据
      if (!accumulatedData.value.x.times.includes(x[0][0]) &&
          !accumulatedData.value.y.times.includes(y[0][0]) &&
          !accumulatedData.value.z.times.includes(z[0][0])) {
        
        
        console.log("新数据");
        // 检查每个轴的数据并发送相应的警报
        for (const [axis, data] of [[x[0][1], 'X'], [y[0][1], 'Y'], [z[0][1], 'Z']]) {
          console.log("emailThreshold",emailThreshold.value);
          await sendEmailAlert(axis as number, data as string);
          await sendSMSAlert(axis as number, data as string);
        }
        // 更新图表数据
        appendData(accumulatedData.value.x, x[0]);
        appendData(accumulatedData.value.y, y[0]);
        appendData(accumulatedData.value.z, z[0]);
        drawTimeChart1(accumulatedData.value);
      }
    }
  } catch (error) {
    console.error("获取最新数据失败：", error);
  }
};

const appendData = (axisData: any, newData: [string, number]) => {
  axisData.times.push(newData[0]);
  axisData.values.push(newData[1]);

  if (axisData.times.length > maxDataLength) {
    axisData.times.shift();
    axisData.values.shift();
  }
};

const startFetchingLatestData = () => {
  if (fetchInterval) clearInterval(fetchInterval);
  fetchInterval = setInterval(fetchLatestData, 60000);
};




const router = useRouter();
const backToMain = () => {
  router.push("/");
};


const devices = ref();
const selectedDevice = ref({
  deviceId: '9A0D1958',
  deviceName: '安楼03',
  disabled: false,
  online: true,
});

//获取设备信息
interface Device {
  deviceName: string;
  deviceId: string;
  offset: number | string; // 这里我假设 offset 是一个数字，如果是字符串请保留您原来的类型
  lowerOuliter: number | string;
  higherOuliter: number | string;
}

// 直接初始化 deviceList 的数据
const deviceList = ref<Device[]>([
  {
    deviceId: '9A0D1958',
    deviceName: '安楼03',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: '4787BE3A',
    deviceName: '综合楼05',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: '8850A7D7',
    deviceName: '综合楼04',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: '8361D7CD',
    deviceName: '综合楼03',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: '612B04ED',
    deviceName: '综合楼02',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: 'E884C99D',
    deviceName: '综合楼01',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: 'F001',
    deviceName: '风压',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: 'A77C5238',
    deviceName: '安楼01',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: 'F853ED49',
    deviceName: '安楼02',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: '87C3D4E4',
    deviceName: '安楼04',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: '29FA1867',
    deviceName: '安楼05',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  },
  {
    deviceId: 'E43AC643',
    deviceName: '安楼06',
    offset: 0,
    lowerOuliter: 100,
    higherOuliter: 200
  }
]);

// 定义级联选择器的选项类型
interface CascaderOption {
  label: string;
  deviceId: string;
  online?: boolean;
  children?: CascaderOption[];
  [key: string]: any; // 添加索引签名
}

// 定义级联选择器的属性
const cascaderProps = {
  expandTrigger: 'hover' as const,
  value: 'deviceId',
  label: 'label',
  children: 'children',
  multiple: false,
  checkStrictly: false
};

// 修改 selectedDevicePath 的类型
const selectedDevicePath = ref<CascaderValue>([]);

// 修改 cascaderDevices 的类型定义
const cascaderDevices = computed<CascaderOption[]>(() => {
  const buildings: Record<string, CascaderOption[]> = {
    '安楼': [],
    '综合楼': [],
    '其他': []
  };

  deviceList.value.forEach(device => {
    const deviceInfo: CascaderOption = {
      label: device.deviceName,
      deviceId: device.deviceId,
      online: devices.value?.find((d: { deviceId: string }) => d.deviceId === device.deviceId)?.online ?? false
    };

    if (device.deviceName.includes('安楼')) {
      buildings['安楼'].push(deviceInfo);
    } else if (device.deviceName.includes('综合楼')) {
      buildings['综合楼'].push(deviceInfo);
    } else {
      buildings['其他'].push(deviceInfo);
    }
  });

  return [
    {
      label: '安楼',
      deviceId: 'building_an',
      children: buildings['安楼'].sort((a, b) => a.label.localeCompare(b.label))
    },
    {
      label: '综合楼',
      deviceId: 'building_zh',
      children: buildings['综合楼'].sort((a, b) => a.label.localeCompare(b.label))
    },
    {
      label: '其他',
      deviceId: 'building_other',
      children: buildings['其他']
    }
  ].filter((building: CascaderOption) => building.children && building.children.length > 0);
});

// 修改设备选择处理函数的类型
const handleDeviceChange = (value: CascaderValue): void => {
  if (value) {
    const deviceId = Array.isArray(value) ? value[value.length - 1]?.toString() : value.toString();
    if (deviceId) {
      const device = deviceList.value.find(d => d.deviceId === deviceId);
      const online = devices.value?.find((d: { deviceId: string }) => d.deviceId === deviceId)?.online ?? false;
      
      if (device) {
        selectedDevice.value = {
          deviceId: deviceId,
          deviceName: device.deviceName,
          disabled: false,
          online: online
        };
      }
    }
  }
};

onMounted(async() => {
  timeChart = echarts.init(document.getElementById('main'));
  amplitudeChart = echarts.init(document.getElementById('main2'));
  await getThresholds('up'); // 添加上阈值
  await getThresholds('down'); // 添加下阈值
  await getThresholds('x_offset'); // 添加偏移量
  await getThresholds('y_offset'); // 添加偏移量
  await getThresholds('z_offset'); // 添加偏移量
  await getThresholds('message_limit'); // 添加偏移量
  await getThresholds('email_limit'); // 添加偏移量
  console.log("devices",devices);
  console.log("selectedDevice",selectedDevice);
})

let timeChart: any;
let amplitudeChart: any;

let timeCurveData: any;
let AmplitudeCurveData: any;

type EChartsOption = echarts.EChartsOption;


//随窗响应式变化
window.addEventListener('resize', function () {
  timeChart.resize();
  amplitudeChart.resize();
});

//绘制时程曲线
const drawTimeChart = (chartData: any) => {
  console.log("chartData",chartData);
  const deviceInfo = deviceList.value.find((d) => d.deviceId === chartData.device);
  if (deviceInfo) {
    chartData.deviceName = deviceInfo.deviceName;
  }
  var option: EChartsOption;

  //计算x轴
  const x_axis = caculateTimeList(chartData.s_date, 16);
  console.log("x_axis",x_axis);
  interface YData {
    [key: string]: number[]; // 添加索引签名，允许任意字符串类型的属性访问
  }

  const yData: YData = {
    x: chartData.x,
    y: chartData.y,
    z: chartData.z
  };

  let series: any[] = [];
  for (let name in yData) {
    var yline: any;
    var line_label: any;
    var label_position: any;

    if (name == 'x') {
      yline = chartData.rmsx;
      line_label = `X均值：${chartData.rmsx}`;
      label_position = 'insideStartTop';
    } else if (name == 'y') {
      yline = chartData.rmsy;
      line_label = `Y均值：${chartData.rmsy}`;
      label_position = 'insideMiddleTop';

    } else if (name == 'z') {
      yline = chartData.rmsz;
      line_label = `Z均值：${chartData.rmsz}`;
      label_position = 'insideEndTop';

    }
    series.push({
      name: name,
      type: 'line',
      data: yData[name],
      smooth: false,
      symbol: 'none', // 设置数据点的样式为 'none'
      markLine: {
        symbol: ['none', 'none'],  // 设置两端都不显示箭头
        data: [
          {name: 'Average', yAxis: yline},
          // 添加上限阈值线
          {
            name: '上限阈值',
            yAxis: upperThreshold.value,  // 设置上限阈值
            label: {
              position: 'insideEndTop',
              formatter: `上限: ${upperThreshold.value}`,
              color: '#ff4d4d'
            },
            lineStyle: {
              color: '#ff4d4d',
              type: 'dashed'
            }
          },
          // 添加下限阈值线
          {
            name: '下限阈值',
            yAxis: lowerThreshold.value,  // 设置下限阈值
            label: {
              position: 'insideEndBottom',
              formatter: `下限: ${lowerThreshold.value}`,
              color: '#ff4d4d'
            },
            lineStyle: {
              color: '#ff4d4d',
              type: 'dashed'
            }
          }
        ],
        itemStyle: {
          normal: {
            lineStyle: {
              color: '#ff0000',
            }
          }
        },
        label: {
          position: label_position,
          formatter: line_label,
          color: '#ff0000',
        }
      }
    })
  }
  option = {
    title: {
      text: `时程曲线：${chartData.deviceName}（设备${chartData.device}）`,
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {   //选择
      data: ['x', 'y', 'z']
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      show: true, // 是否显示工具栏
      feature: {
        saveAsImage: {}  //保存图片
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: x_axis
    },
    yAxis: {
      type: 'value',
      scale: true ,// 自动调整显示范围
      axisLabel: {
        formatter: '{value} gal'
      }
    },
    dataZoom: [
    {
      type: 'inside', // 内部缩放
      xAxisIndex: 0 // 针对 x 轴
    },
    {
      type: 'slider', // 滑块缩放
      xAxisIndex: 0 // 针对 x 轴
    },
    {
      type: 'inside', // 内部缩放
      yAxisIndex: 0 // 针对 y 轴
    },
    {
      type: 'slider', // 滑块缩放
      yAxisIndex: 0 // 针对 y 轴
    }
    ],
    series: series
  };

  option && timeChart.setOption(option);
}


//绘制幅频曲线
const drawAmplitudeChart = (data: any) => {
  const deviceInfo = deviceList.value.find((d) => d.deviceId === data.device);
  if (deviceInfo) {
    data.deviceName = deviceInfo.deviceName;
  }
  var option2: EChartsOption;

  //计算x轴
  interface YData {
    [key: string]: number[]; // 添加索引签名，允许任意字符串类型的属性访问
  }

  const yData: YData = {
    x: data.x,
    y: data.y,
    z: data.z
  };


  let series: any[] = [];
  for (let name in yData) {
    if (Object.prototype.hasOwnProperty.call(yData, name)) {
      series.push({
        name: name,
        type: 'line',
        data: yData[name],
        smooth: false,
        symbol: 'none', // 设置数据点的样式为 'none'
      });
    }
  }

  option2 = {
    title: {
      text: `频幅曲线：${data.deviceName}（设备${data.device}）`,
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {   //选择
      data: ['x', 'y', 'z']
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      show: true, // 是否显示工具栏
      feature: {
        saveAsImage: {}  //保存图片
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.interval
    },
    yAxis: {
      type: 'value',
      scale: true // 自动调整显示范围
    },
    dataZoom: [
    {
      type: 'inside', // 内部缩放
      xAxisIndex: 0 // 针对 x 轴
    },
    {
      type: 'slider', // 滑块缩放
      xAxisIndex: 0 // 针对 x 轴
    },
    {
      type: 'inside', // 内部缩放
      yAxisIndex: 0 // 针对 y 轴
    },
    {
      type: 'slider', // 滑块缩放
      yAxisIndex: 0 // 针对 y 轴
    }
  ],
    series: series
  };
  option2 && amplitudeChart.setOption(option2);
}


//WebSocket
const websocketUrl = 'wss://digetech.cn:8771/websocket/user_58';
let socket1 = new WebSocket(websocketUrl);

//socket请求参数1：获取设备实时状态
const request1 = {
  code: 2,
  data: [
    'F001',
    '4787BE3A',
    '8850A7D7',
    '8361D7CD',
    '612B04ED',
    'E884C99D',
    'E43AC643',
    'A77C5238',
    'F853ED49',
    '87C3D4E4',
    '29FA1867',
    '9A0D1958'
  ],
  key: 'qiushangzhou852'
};
//socket请求参数2：获取设备详细数据
let request2 = {
  code: 1,
  data: selectedDevice.value.deviceId,
  channel: '0',
  pam: 1,
  key: 'qiushangzhou852'
};


//socket连接成功
socket1.onopen = () => {
  console.log('WebSocket connection1 opened');
  // WebSocket连接成功后发送请求1——获取设备实时状态
  socket1.send(JSON.stringify(request1));
  socket1.send(JSON.stringify(request2));
};

//接收到socket消息
socket1.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.code = 20001) {
    if (message.message == '基础数据') {
      // console.log(message.data);
      timeCurveData = message.data[0];
      AmplitudeCurveData = message.data[1];
      if (dataSource.value === 'websocket') {
        drawTimeChart(timeCurveData);
        drawAmplitudeChart(AmplitudeCurveData);
      }
    } else if (message.message == '设备状态') {
      // console.log(message.data);
      devices.value = Object.entries(message.data).map(([key, value]) => ({
        deviceId: key,
        disabled: value === 1 ? false : true,
        online: value === 1 ? true : false
      }))
      devices.value.forEach((device: { deviceId: string; deviceName: string; }) => {
        // 假设 deviceList 已经填充了设备名
        const deviceInfo = deviceList.value.find((d) => d.deviceId === device.deviceId);
        if (deviceInfo) {
          device.deviceName = deviceInfo.deviceName;
        }
      });

    }

  }
};

//socket错误
socket1.onerror = (error) => {
  console.error('WebSocket error:', error);
};

//socket关闭
socket1.onclose = () => {
  console.log('WebSocket connection closed');
};


watch([selectedDevice, dataSource], async ([newDevice, newDataSource]) => {
  if (newDevice) {
    await getThresholds('up');
    await getThresholds('down');
    await getThresholds('x_offset');
    await getThresholds('y_offset');
    await getThresholds('z_offset');
    await getThresholds('message_limit');
    await getThresholds('email_limit');
  }
  if (newDataSource === 'websocket') {
    // 使用 WebSocket 获取数据
    request2.data = newDevice.deviceId;
    socket1.close();
    socket1 = new WebSocket(websocketUrl);
    socket1.onopen = () => {
      console.log('WebSocket connection1 reopened');
      // WebSocket连接成功后发送请求1——获取设备实时状态
      socket1.send(JSON.stringify(request1));
      socket1.send(JSON.stringify(request2));
    };
  //接收到socket消息
      
  }
  else if (newDataSource === 'api_minute') {
    if (socket1) {
      socket1.close(); // 关闭 WebSocket 连接
    }
    // 使用 API 获取数据
    await loadData('minute', 6000);
    await startFetchingLatestData();
  } else if (newDataSource === 'api_day') {
    if (socket1) {
      socket1.close(); // 关闭 WebSocket 连接
    }
    // 使用 API 获取天级别数据
    await loadData('daily', 78);
  } else if (newDataSource === 'api_hour') {
    if (socket1) {
      socket1.close(); // 关闭 WebSocket 连接
    }
    // 使用 API 获取小时级别数据
    await loadData('hourly', 1000);
  } else if (newDataSource === 'api_month') {
    if (socket1) {
      socket1.close(); // 关闭 WebSocket 连接
    }
    // 使用 API 获取月级别数据
    await loadData('monthly', 12);
  } else if (newDataSource === 'api_year') {
    if (socket1) {
      socket1.close(); // 关闭 WebSocket 连接
    }
    // 使用 API 获取年级别数据
    await loadData('yearly', 5);
  }
    
  socket1.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.code = 20001) {
          if (message.message == '基础数据') {
            console.log(message.data);
            timeCurveData = message.data[0];
            AmplitudeCurveData = message.data[1];
            drawTimeChart(message.data[0]);
            drawAmplitudeChart(message.data[1]);
          } else if (message.message == '设备状态') {
            console.log("message.data",message.data);
            devices.value = Object.entries(message.data).map(([key, value]) => ({
              deviceId: key,
              disabled: value === 1 ? false : true,
              online: value === 1 ? true : false
            }))
            devices.value.forEach((device: { deviceId: string; deviceName: string; }) => {
              // 假设 deviceList 已经填充了设备名
              const deviceInfo = deviceList.value.find((d) => d.deviceId === device.deviceId);
              if (deviceInfo) {
                device.deviceName = deviceInfo.deviceName;
          }
        });
      }

    }
  };

});

</script>

<style scoped>
#main,
#main2 {
  margin: 20px;
  width: 90%;
  padding: 30px;
}

.back-to-main-btn {
  margin: 0px;
  align-self: flex-start;
  /* 对齐到容器的左侧 */
}

/* 添加级联选择器的样式 */
:deep(.el-cascader) {
  width: 100%;
}
</style>