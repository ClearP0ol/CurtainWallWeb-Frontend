<template>
    <div class="main-container">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 5px; margin-right: 5px">
        <el-button type="primary" @click="backToMain">返回主页</el-button>
      </div>
      <div class="demo-image">
        <el-table :data="tableData" :border="parentBorder" style="width: 100%">
          <el-table-column label="检测时间">
            <template #default="scope">
              <!-- 显示文字 -->
              <span>{{ scope.row.time }}</span>
            </template>
          </el-table-column>
          <el-table-column label="识别结果">
            <template #default="scope">
              <!-- 显示文字 -->
              <span>{{ scope.row.result }}</span>
            </template>
          </el-table-column>
          <el-table-column label="图片展示">
            <template #default="scope">
              <el-image style="width: 400px; height: 200px" :src="scope.row.photo" :fit="cover"></el-image>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from "vue";
  import axios from "axios";
  import { useRouter } from "vue-router";
  
  const router = useRouter();
  const backToMain = () => {
    router.push("/");
  };
  
  const parentBorder = ref(true);
  const tableData = ref([]);
  
  onMounted(() => {
    axios
      .get("http://localhost:5000/defect/historydata")
      .then((response) => {
        tableData.value = response.data;
      })
      .catch((error) => {
        console.error("Error fetching tableData:", error);
      });
  });
  </script>
  
  <style scoped>
  .main-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 10px;
  }
  
  .demo-image {
    overflow: auto;
  }
  </style>
  