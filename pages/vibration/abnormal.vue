<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-xl font-semibold">三级预警记录查询</h1>
        <div class="flex items-center gap-4">
          <el-tooltip content="按设备、方向、预警等级和时间范围查询模型基线偏离记录" placement="bottom">
            <el-icon><InfoFilled /></el-icon>
          </el-tooltip>
          <el-button type="primary" @click="router.push('/')">返回主页</el-button>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-6">
      <div class="bg-white rounded p-4 mb-6">
        <div class="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
          这里展示的是“实际值相对模型标准值的绝对差”所触发的三级预警记录，兼容下限与兼容上限用于承接旧接口数据。
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block mb-2">设备选择</label>
            <el-select v-model="selectedDeviceId" class="w-full" :disabled="loading" filterable>
              <el-option-group
                v-for="group in groupedDeviceOptions"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="device in group.options"
                  :key="device.device_id"
                  :label="device.device_name"
                  :value="device.device_id"
                />
              </el-option-group>
            </el-select>
          </div>

          <div>
            <label class="block mb-2">偏离方向</label>
            <el-select v-model="selectedDirection" class="w-full" :disabled="loading">
              <el-option
                v-for="option in filteredDirectionOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <div>
            <label class="block mb-2">预警等级</label>
            <el-select v-model="selectedLevel" class="w-full" :disabled="loading">
              <el-option
                v-for="option in levelOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <div>
            <label class="block mb-2">开始时间</label>
            <el-date-picker
              v-model="startTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="!w-full"
              :disabled="loading"
              :disabled-date="disabledStartDate"
            />
          </div>

          <div>
            <label class="block mb-2">结束时间</label>
            <el-date-picker
              v-model="endTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="!w-full"
              :disabled="loading"
              :disabled-date="disabledEndDate"
            />
          </div>
        </div>

        <div class="flex justify-end mt-4 gap-4">
          <el-button type="primary" :loading="loading" @click="handleSearch">
            查询
          </el-button>
          <el-button type="primary" plain :loading="loading" @click="downloadData">
            导出数据
          </el-button>
        </div>
      </div>

      <div class="bg-white rounded p-4">
        <div class="flex justify-center w-full">
          <div v-if="loading" class="h-[500px] flex items-center justify-center">
            <el-icon class="is-loading"><Loading /></el-icon>
          </div>

          <div v-else-if="tableData.length > 0" class="table-container w-[95%]">
            <el-table :data="tableData" border height="500" :max-height="500" style="width: 100%">
              <el-table-column prop="device_id" label="设备 ID" min-width="120" fixed />
              <el-table-column prop="device_name" label="设备名称" min-width="140" fixed />
              <el-table-column prop="time" label="时间" min-width="180" />
              <el-table-column label="方向" min-width="150">
                <template #default="scope">
                  {{ getDirectionLabel(scope.row.direction) }}
                </template>
              </el-table-column>
              <el-table-column label="预警等级" min-width="120">
                <template #default="scope">
                  <el-tag :type="getAlertLevelTag(scope.row.alert_level)" size="small">
                    {{ getAlertLabel(scope.row.alert_level) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="实际值" min-width="120">
                <template #default="scope">
                  {{ formatMetric(scope.row.actual_value) }}
                </template>
              </el-table-column>
              <el-table-column label="标准值" min-width="120">
                <template #default="scope">
                  {{ formatMetric(scope.row.standard_value) }}
                </template>
              </el-table-column>
              <el-table-column label="绝对差" min-width="120">
                <template #default="scope">
                  {{ formatMetric(scope.row.deviation) }}
                </template>
              </el-table-column>
              <el-table-column label="兼容下限" min-width="120">
                <template #default="scope">
                  {{ formatMetric(scope.row.min) }}
                </template>
              </el-table-column>
              <el-table-column label="兼容上限" min-width="120">
                <template #default="scope">
                  {{ formatMetric(scope.row.max) }}
                </template>
              </el-table-column>
            </el-table>
          </div>

          <el-empty v-else description="暂无预警记录" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { sub } from "date-fns";
import { ElMessage } from "element-plus";
import { InfoFilled, Loading } from "@element-plus/icons-vue";
import {
  deriveAlertMetrics,
  getAlertLevelLabel,
  getAlertLevelTagType,
  getVibrationAlertConfig,
} from "~/composables/useVibrationAlertConfig";

const router = useRouter();
const apiServerUrl = "http://8.153.161.229:8009";

interface DeviceInfo {
  device_id: string;
  device_name: string;
}

interface TableRow {
  device_id: string;
  device_name: string;
  time: string;
  direction: string;
  min?: number;
  max?: number;
  actual_value: number | null;
  standard_value: number | null;
  deviation: number | null;
  alert_level: "normal" | "level3" | "level2" | "level1";
}

const loading = ref(false);
const tableData = ref<TableRow[]>([]);

const deviceList: DeviceInfo[] = [
  { device_id: "87C3D4E4", device_name: "安楼外幕墙1A" },
  { device_id: "1A193E69", device_name: "安楼外幕墙1B" },
  { device_id: "14B0F67E", device_name: "安楼外幕墙1C" },
  { device_id: "55DA00B5", device_name: "安楼外幕墙2D" },
  { device_id: "9A0D1958", device_name: "安楼外幕墙2E" },
  { device_id: "F853ED49", device_name: "安楼外幕墙2F" },
  { device_id: "0002", device_name: "安楼外幕墙2Y" },
  { device_id: "E884C99D", device_name: "衷和楼#1G" },
  { device_id: "612B04ED", device_name: "衷和楼#1H" },
  { device_id: "8361D7CD", device_name: "衷和楼#2I" },
  { device_id: "8850A7D7", device_name: "衷和楼#2J" },
  { device_id: "4787BE3A", device_name: "衷和楼测点7" },
  { device_id: "0020", device_name: "衷和楼#2Y" },
];

const groupedDeviceOptions = computed(() => [
  {
    label: "安楼设备",
    options: deviceList.filter((device) => device.device_name.includes("安楼") && device.device_id !== "0002"),
  },
  {
    label: "衷和楼设备",
    options: deviceList.filter(
      (device) => (device.device_name.includes("衷和楼") || device.device_name.includes("综合楼")) && device.device_id !== "0020"
    ),
  },
  {
    label: "应变计设备",
    options: deviceList.filter((device) => device.device_id === "0002" || device.device_id === "0020"),
  },
]);

const isStrainDevice = (deviceId: string) => deviceId === "0002" || deviceId === "0020";

const allDirectionOptions = [
  { value: "x_above_max", label: "X 轴超过最大值", type: "vibration" },
  { value: "x_below_min", label: "X 轴低于最小值", type: "vibration" },
  { value: "y_above_max", label: "Y 轴超过最大值", type: "vibration" },
  { value: "y_below_min", label: "Y 轴低于最小值", type: "vibration" },
  { value: "z_above_max", label: "Z 轴超过最大值", type: "vibration" },
  { value: "z_below_min", label: "Z 轴低于最小值", type: "vibration" },
  { value: "ch1_above_max", label: "Ch1 超过最大值", type: "strain" },
  { value: "ch1_below_min", label: "Ch1 低于最小值", type: "strain" },
  { value: "ch2_above_max", label: "Ch2 超过最大值", type: "strain" },
  { value: "ch2_below_min", label: "Ch2 低于最小值", type: "strain" },
];

const levelOptions = [
  { value: "all", label: "全部等级" },
  { value: "level1", label: "一级预警" },
  { value: "level2", label: "二级预警" },
  { value: "level3", label: "三级预警" },
];

const selectedDeviceId = ref("55DA00B5");
const selectedDirection = ref("y_above_max");
const selectedLevel = ref("all");

const end = new Date();
const start = sub(end, { days: 7 });
const startTime = ref(start.toISOString().slice(0, 19).replace("T", " "));
const endTime = ref(end.toISOString().slice(0, 19).replace("T", " "));

const currentDevice = computed(
  () => deviceList.find((device) => device.device_id === selectedDeviceId.value) ?? deviceList[0]
);

const filteredDirectionOptions = computed(() =>
  allDirectionOptions.filter((option) =>
    isStrainDevice(selectedDeviceId.value) ? option.type === "strain" : option.type === "vibration"
  )
);

const getDirectionLabel = (direction: string) =>
  (
    {
      x_above_max: "X 轴超过最大值",
      x_below_min: "X 轴低于最小值",
      y_above_max: "Y 轴超过最大值",
      y_below_min: "Y 轴低于最小值",
      z_above_max: "Z 轴超过最大值",
      z_below_min: "Z 轴低于最小值",
      ch1_above_max: "Ch1 超过最大值",
      ch1_below_min: "Ch1 低于最小值",
      ch2_above_max: "Ch2 超过最大值",
      ch2_below_min: "Ch2 低于最小值",
    } as Record<string, string>
  )[direction] ?? direction;

const formatMetric = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "--";

const getAlertLabel = (level: TableRow["alert_level"]) => getAlertLevelLabel(level);
const getAlertLevelTag = (level: TableRow["alert_level"]) => getAlertLevelTagType(level);

const mapRecordToRow = (record: Record<string, unknown>): TableRow => {
  const deviceName = String(record.device_name ?? currentDevice.value.device_name);
  const deviceId =
    String(record.device_id ?? "") ||
    deviceList.find((item) => item.device_name === deviceName)?.device_id ||
    currentDevice.value.device_id;

  const metrics = deriveAlertMetrics(record, getVibrationAlertConfig(deviceName));

  return {
    device_id: deviceId,
    device_name: deviceName,
    time: String(record.time ?? ""),
    direction: String(record.direction ?? selectedDirection.value),
    min: typeof record.min === "number" ? record.min : Number(record.min ?? NaN),
    max: typeof record.max === "number" ? record.max : Number(record.max ?? NaN),
    actual_value: metrics.actualValue,
    standard_value: metrics.standardValue,
    deviation: metrics.deviation,
    alert_level: metrics.level,
  };
};

const fetchData = async () => {
  loading.value = true;
  tableData.value = [];

  try {
    const deviceName = currentDevice.value.device_name;
    const response = await fetch(
      `${apiServerUrl}/data/get_abnormal_data?${new URLSearchParams({
        device: deviceName,
        direction: selectedDirection.value,
        start_time: startTime.value,
        end_time: endTime.value,
      }).toString()}`
    );

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.status !== "success" || !Array.isArray(result.data)) {
      ElMessage.warning(result.message || "未获取到数据");
      return;
    }

    const rows = result.data.map((item: Record<string, unknown>) => mapRecordToRow(item));
    tableData.value =
      selectedLevel.value === "all"
        ? rows
        : rows.filter((row) => row.alert_level === selectedLevel.value);

    if (tableData.value.length === 0) {
      ElMessage.info("当前筛选条件下没有匹配的预警记录");
    }
  } catch (error) {
    console.error("获取预警记录失败:", error);
    ElMessage.error(error instanceof Error ? error.message : "获取预警记录失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  if (!selectedDeviceId.value || !selectedDirection.value || !startTime.value || !endTime.value) {
    ElMessage.warning("请选择完整的查询条件");
    return;
  }

  if (new Date(startTime.value) > new Date(endTime.value)) {
    ElMessage.warning("开始时间不能晚于结束时间");
    return;
  }

  await fetchData();
};

const downloadData = async () => {
  if (!selectedDeviceId.value || !selectedDirection.value || !startTime.value || !endTime.value) {
    ElMessage.warning("请选择完整的导出条件");
    return;
  }

  const url = `${apiServerUrl}/data/download_abnormal_data?${new URLSearchParams({
    device: selectedDeviceId.value,
    direction: selectedDirection.value,
    start_time: startTime.value,
    end_time: endTime.value,
  }).toString()}`;

  const link = document.createElement("a");
  link.href = url;
  link.download = `预警记录_${selectedDeviceId.value}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const disabledStartDate = (time: Date) => {
  const earliestDate = new Date("2023-01-01T00:00:00");
  const latestDate = new Date();
  latestDate.setHours(latestDate.getHours() - 1);
  return time.getTime() < earliestDate.getTime() || time.getTime() > latestDate.getTime();
};

const disabledEndDate = (time: Date) => {
  let earliestDate = new Date("2023-01-01T00:00:00");
  if (startTime.value) {
    earliestDate = new Date(startTime.value);
  }

  const latestDate = new Date();
  latestDate.setHours(latestDate.getHours() - 1);
  return time.getTime() < earliestDate.getTime() || time.getTime() > latestDate.getTime();
};

onMounted(() => {
  if (isStrainDevice(selectedDeviceId.value)) {
    selectedDirection.value = "ch1_above_max";
  }
});

watch(selectedDeviceId, (deviceId) => {
  selectedDirection.value = isStrainDevice(deviceId) ? "ch1_above_max" : "y_above_max";
});
</script>

<style scoped>
.el-date-editor.el-input,
.el-date-editor.el-input__wrapper {
  width: 100%;
}

.table-container {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  margin: 0 auto;
  width: 95%;
}

:deep(.el-table) {
  width: 100% !important;
}

.el-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
  text-align: center;
}

.el-table td {
  text-align: center;
}

:deep(.el-table .cell) {
  text-align: center;
}
</style>
