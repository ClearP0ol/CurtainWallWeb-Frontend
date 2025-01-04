<template>
  <div style="position: fixed; right: 10px; top: 15px; z-index: 1000;">
    <el-button
      type="primary"
      class="back-to-main-btn"
      @click="backToMain"
      style="position: absolute; right: 0; top: 0;"
    >
      返回主页
    </el-button>
  </div>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="报警记录" :badge="total"> </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <select 
            v-model="selectedDevice" 
            @change="handleSelectDevice"
            style="width: 200px; height: 32px; margin-left: 10px;"
          >
            <option disabled value="">请选择设备</option>
            <option value="F001">风压</option>
            <option value="4787BE3A">综合楼05</option>
            <option value="8850A7D7">综合楼04</option>
            <option value="8361D7CD">综合楼03</option>
            <option value="612B04ED">综合楼02</option>
            <option value="E884C99D">综合楼01</option>
            <option value="E43AC643">安楼06</option>
            <option value="29FA1867">安楼05</option>
            <option value="87C3D4E4">安楼04</option>
            <option value="9A0D1958">安楼03</option>
            <option value="F853ED49">安楼02</option>
            <option value="A77C5238">安楼01</option>
          </select>
          <DateRangePicker @selectRange="handleSelectRange"></DateRangePicker>
        </template>
      </UDashboardToolbar>

      <AlarmRecordsTable :records="records" v-if="records != null"></AlarmRecordsTable>
      <UContainer v-else>暂无结果</UContainer>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from 'axios';

const router = useRouter();
const backToMain = () => {
  router.push("/subindex");
};

// 基础数据
const selectedDevice = ref('');
const records = ref(null);
const total = ref(0);

// 获取报警记录
const getAlarmRecords = async (deviceId: string, startTime: string, endTime: string) => {
  try {
    const response = await axios.get('http://110.42.214.164:8009/data/get_message_data', {
      params: {
        device: deviceId,
        startTime: startTime,
        endTime: endTime
      }
    });

    if (response.data.status === 'success' && response.data.data) {
      records.value = response.data.data;
      console.log('报警记录:', response.data);
    } else {
      console.error("Error: No data returned from API.");
      records.value = null;
    }
  } catch (error) {
    console.error("Error fetching message data:", error);
    records.value = null;
  }
};

// 设备选择事件
const handleSelectDevice = (val: Event) => {
  const target = val.target as HTMLSelectElement;
  getAlarmRecords(target.value, '', '');
};

// 时间范围选择事件
const handleSelectRange = (range: { startTime: string; endTime: string }) => {
  if (selectedDevice.value) {
    getAlarmRecords(selectedDevice.value, range.startTime, range.endTime);
  }
};

// 初始化加载
onMounted(() => {
  selectedDevice.value = "F001";
  getAlarmRecords("F001", '', '');
});
</script>

<style scoped>
.back-to-main-btn {
  margin: 0px;
  align-self: flex-start;
}
</style>
