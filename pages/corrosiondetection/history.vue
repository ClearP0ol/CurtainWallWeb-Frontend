<template>
  <div class="history-wrap">
    <div style="position: fixed; right: 10px; top: 10px; z-index: 1000;">
      <el-button type="primary" class="back-to-main-btn" @click="backToMain"
                 style="position: absolute; right: 0; top: 0;">返回主页
      </el-button>
    </div>

    <div class="result-wrap">
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="date" label="检测时间" width="180"></el-table-column>
        <el-table-column prop="fileName" label="图片文件名" width="180"></el-table-column>
        <el-table-column label="查看" width="100">
          <template #default="scope">
            <el-link :href="scope.row.imagePath" target="_blank">查看</el-link>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="primary" @click="deleteRecord(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-button type="primary" @click="deleteAllRecords" class="delete-all-btn">删除所有记录</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from "vue-router";

const tableData = ref([]); // 用于存储检测记录
const router = useRouter();
const backToMain = () => {
  router.push("/");
};

// 删除单条记录
const deleteRecord = (record) => {
  const index = tableData.value.indexOf(record);
  if (index !== -1) {
    tableData.value.splice(index, 1);
  }
};

// 删除所有记录
const deleteAllRecords = () => {
  tableData.value = [];
};

// 模拟获取数据的函数 (请根据实际情况替换)
const fetchData = async () => {
  const response = await axios.get("http://110.42.214.164:8000/post");
  tableData.value = response.data;
};

// 这里模拟一些数据
tableData.value = [
  { date: '2023-10-01', fileName: 'image1.jpg', imagePath: 'http://example.com/image1.jpg' },
  { date: '2023-10-02', fileName: 'image2.jpg', imagePath: 'http://example.com/image2.jpg' },
  { date: '2023-10-03', fileName: 'image3.jpg', imagePath: 'http://example.com/image3.jpg' },
];

// 页面加载时获取数据
fetchData();
</script>

<style>
.history-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
}

.back-to-main-btn {
  margin: 5px;
  align-self: flex-end;
}

.result-wrap {
  width: 100%;
}

.delete-all-btn {
  margin-top: 20px;
  width: 100px; /* 使按钮占满宽度 */
}

.el-button {
  background-color: blue; /* 设置按钮背景颜色为蓝色 */
  color: white; /* 设置按钮字体颜色为白色 */
}

.el-button:hover {
  background-color: darkblue; /* 鼠标悬停时按钮颜色 */
}

.el-table {
  width: 100%; /* 表格占满宽度 */
}

.el-table-column {
  text-align: center; /* 使内容居中对齐 */
}

.el-table-column .cell {
  display: flex;
  justify-content: center; /* 使单元格内容居中对齐 */
  align-items: center;
}
</style>