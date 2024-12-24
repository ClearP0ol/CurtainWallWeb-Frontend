<script lang="ts">

import { defineComponent, reactive } from "vue";
import {ElMessage} from "element-plus";
import axios from 'axios';
// import Pagination from "@/components/Pagination";

interface ListQuery {
  batch: number;
  limit: number;
}

interface ListItem {
  id: number;
  batch: number;
  time: string;
  elasticityModulus: number;
  structuralAdhesiveStress: number;
  panelDamageArea: number;
  structuralAdhesiveDamageLength: number;
  connectorsNumber: number;
  backBoltsNumber: number;
  panelVerticality: number;
  stitchingWidth: number;
  panelSize: number;
  Offset_x: number;
  Offset_y: number;
  Offset_z: number;
  flatness: number;
  stains: number;
  cracks: number;
  eresult: number;
  rresult: number;
}

export default defineComponent({
  name: "ComplexTable",
  // components: { Pagination },
  setup() {
    const list = reactive<ListItem[]>([]);
    const listQuery = reactive<ListQuery>({
      batch: 1,
      limit: 10,
    });

    const total = reactive({ value: 0 });
    const listLoading = reactive({ value: false });

    // 阈值设置，危险阈值与安全阈值
    const thresholds = reactive({
      low: 0.3,
      high: 0.6,
    });

    // 临时阈值
    const tempThresholds = reactive({
      low: thresholds.low.toString(),
      high: thresholds.high.toString(),
    });

    // 应用阈值
    const applyThresholds = async () =>{
      listLoading.value = true;
      try{
        // 将字符串转换为数字
        const lowValue = parseFloat(tempThresholds.low);
        const highValue = parseFloat(tempThresholds.high);

        // 验证 low 和 high 是否在 0 到 1 之间
        if (isNaN(lowValue) || lowValue < 0 || lowValue > 1) {
          ElMessage.error("Low threshold must be a number between 0 and 1.");
          return;
        }

        if (isNaN(highValue) || highValue < 0 || highValue > 1) {
          ElMessage.error("High threshold must be a number between 0 and 1.");
          return;
        }

        // 验证 low 是否小于 high
        if (lowValue >= highValue) {
          ElMessage.error("Low threshold must be less than High threshold.");
          return;
        }

        thresholds.low = lowValue;
        thresholds.high = highValue;
        tempThresholds.low = lowValue.toString();
        tempThresholds.high = highValue.toString();
      }
      catch(error) {
        console.error('Fail to apply thresholds:', error);
      }finally {
        listLoading.value = false;
      }
    }

    //console.log('Set up');

    // 获取标签的计算方法
    const getStatusLabel = (item: ListItem) => {
      if ((item.eresult+item.rresult)/2 >= thresholds.high) {
        return "Safe";
      } else if((item.eresult+item.rresult)/2 < thresholds.low) {
        return "Danger";
      } else {
        return "Warning"
      }
    };

    const fetchBatchData = async (batch: number) => {
      try {
        // http://110.42.214.164:8005/data/batch_data
        // http://127.0.0.1:8000/data/batch_data
        const response = await axios.get(`http://110.42.214.164:8005/data/batch_data`, {
          params: { batch },
        });
        return response.data;
      } catch (error) {
          console.error('Failed to fetch batch data:', error);
          throw error;
      }
    };


    const getList = async () => {
      listLoading.value = true;
      try{
        const response = await fetchBatchData(listQuery.batch);
        // console.log('response:', response);
        if(response && response.data){
          list.length = 0;
          response.data.forEach((item: ListItem) => list.push(item));
          total.value = response.data.length;
        } else {
          console.error('No data returned frome API');
        }
      }
      catch(error) {
        console.error('Fail to load data:', error);
      }finally {
        listLoading.value = false;
      }
    };

    const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleString();

    return {
      list,
      listQuery,
      total,
      listLoading,
      thresholds,
      tempThresholds,
      getList,
      formatDate,
      getStatusLabel,
      applyThresholds,
    };
  },
});
</script>

<template>

  <div class="app-container">
    <!-- 筛选部分 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.batch"
        placeholder="Batch"
        class="filter-item"
        style="width: 100px;"
        @keyup.enter="getList"
      />
      <el-input
        v-model="listQuery.limit"
        placeholder="Limit"
        class="filter-item"
        style="width: 100px;"
        @keyup.enter="getList"
      />
      <el-button
        type="primary"
        class="filter-item"
        icon="el-icon-search"
        @click="getList"
      >
        Search
      </el-button>

      <el-input
        v-model="tempThresholds.low"
        placeholder="Danger"
        class="filter-item"
        style="width: 80px;" 
        @keyup.enter="applyThresholds"
      />
      <el-input
        v-model="tempThresholds.high"
        placeholder="Safe"
        class="filter-item"
        style="width: 80px;" 
        @keyup.enter="applyThresholds"
      />
      <el-button
        type="primary"
        class="filter-item"
        icon="el-icon-refresh"
        @click="applyThresholds"
      >
        Apply Thresholds
      </el-button>
    </div>

    <!-- 表格部分 -->
    <el-table
      :data="list"
      v-loading="listLoading.value"
      border
      style="width: 100%;"
    >
      <el-table-column prop="id" label="ID" width="60" align="center" />
      <el-table-column label="Status" width="100">
        <template #default="{ row }">
          <span :class="getStatusLabel(row)">
            {{ getStatusLabel(row) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="eresult" label="E-Result" width="100" >
        <template #default="{ row }">
          {{ row.eresult.toFixed(3) }}
        </template>
      </el-table-column>
      <el-table-column prop="rresult" label="R-Result" width="100" >
        <template #default="{ row }">
          {{ row.rresult.toFixed(3) }}
        </template>
      </el-table-column>
      <el-table-column prop="batch" label="Batch" width="80" align="center" />
<!--      <el-table-column prop="time" label="Time" width="100" align="center">
      <template #default="{ row }">
        {{ formatDate(row.time) }}
      </template>
      </el-table-column>-->
      <el-table-column
        prop="elasticityModulus"
        label="Elasticity Modulus"
        width="100"
      >
        <template #default="{ row }">
          {{ row.elasticityModulus.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="structuralAdhesiveStress"
        label="Adhesive Stress"
        width="100"
      >
        <template #default="{ row }">
          {{ row.structuralAdhesiveStress.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="panelDamageArea"
        label="Panel Damage Area"
        width="100"
      >
        <template #default="{ row }">
          {{ row.panelDamageArea.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="panelVerticality"
        label="Panel Verticality"
        width="100"
      >
        <template #default="{ row }">
          {{ row.panelVerticality.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="stains" label="Stains" width="80" >
        <template #default="{ row }">
          {{ row.stains.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="cracks" label="Cracks" width="80" >
        <template #default="{ row }">
          {{ row.cracks.toFixed(2) }}
        </template>
      </el-table-column>

    </el-table>

    <!-- 分页部分 -->
<!--    <el-pagination
      :total="total.value"
      :page.sync="listQuery.batch"
      :page-size.sync="listQuery.limit"
      background
      layout="prev, pager, next"
      @current-change="getList"
    />-->
  </div>

</template>


<style scoped>

  .Safe {
  background-color: #4caf50; /* Green background */
  color: white; /* White text */
  padding: 3px 6px;
  border-radius: 4px;
  }

  .Warning {
  background-color: #ff9800; /* Orange background */
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  }

  .Danger {
  background-color: #f44336; /* Red background */
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  }

</style>