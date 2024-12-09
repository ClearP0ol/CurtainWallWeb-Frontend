<template>
  <div class="history-wrap">
    <div style="position: fixed; right: 10px; top: 10px; z-index: 1000;">
      <el-button type="primary" class="back-to-main-btn" @click="backToMain"
                 style="position: absolute; right: 0; top: 0;">返回主页
      </el-button>
    </div>

    <div class="result-wrap">
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="username" label="用户名" width="200"></el-table-column>
        <el-table-column prop="id" label="编号" width="100"></el-table-column>
        <el-table-column prop="upload_time" label="检测时间" width="250"></el-table-column>
        <el-table-column prop="filename" label="图片文件名" width="400"></el-table-column>
        <el-table-column label="查看" width="100">
          <template #default="scope">
            <el-link :href="scope.row.imagePath" target="_blank">查看</el-link>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="primary" @click="confirmDeleteRecord(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-button type="primary" @click="confirmDeleteAllRecords" class="delete-all-btn">删除所有记录</el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from "vue-router";
import axios from 'axios'; // 确保引入 axios
import { ElMessageBox } from 'element-plus'; // 引入提示框组件

const tableData = ref([]); // 用于存储检测记录
const router = useRouter();
const backToMain = () => {
  router.push("/");
};

// 获取数据的函数
const fetchData = async () => {
  try {
    const formData = new FormData();
    formData.append('UserID', '1'); // 假设 UserID 是 13
    const response = await axios.post("http://110.42.214.164:8000/get_upload_history_user", formData, {
      headers: {
        'Content-Type': 'multipart/form-data' // 保持 Content-Type 为 multipart/form-data
      },
      responseType: 'json'
    });

    // 假设 response.data 是一个数组，使用 map 提取所需字段
    tableData.value = response.data.map(item => ({
      username: item.username,
      user_id:item.user_id,
      id: item.id,
      upload_time: item.upload_time, // 使用 upload_time 作为检测时间
      filename: item.filename, // 使用 filename 作为文件名
      //imagePath: item.url, // 假设您希望使用 username 作为查看链接的路径
    }));
  } catch (error) {
    console.error('获取数据失败:', error);
    alert('获取数据失败，请重试');
  }
};
// 页面加载时获取数据
fetchData();

// 确认删除单条记录
const confirmDeleteRecord = (record) => {
  ElMessageBox.confirm('确定要删除吗？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
    customClass: 'custom-delete-confirm' // 添加自定义类
  }).then(() => {
    deleteRecord(record);
  }).catch(() => {
    // 取消删除时的处理
    console.log('取消删除');
  });
};

// 删除单条记录
const deleteRecord = async (record) => {
  const formData = new FormData();
  formData.append('UserID', record.user_id);
  formData.append('RecordID', record.id);
  try {
    // 发送删除请求
    await axios.post("http://110.42.214.164:8000/delete_upload_history_user", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    // 从 tableData 中删除记录
    const index = tableData.value.indexOf(record);
    if (index !== -1) {
      tableData.value.splice(index, 1);
    }
    ElMessageBox.alert('记录已成功删除', '提示', {
      confirmButtonText: '确定',
      type: 'success'
    });
  } catch (error) {
    console.error('删除记录失败:', error);
    ElMessageBox.alert('删除记录失败，请重试', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    });
  }
};

// 确认删除所有记录
const confirmDeleteAllRecords = () => {
  ElMessageBox.confirm('确定要删除所有记录吗？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
    customClass: 'custom-delete-confirm' // 添加自定义类
  }).then(() => {
    deleteAllRecords();
  }).catch(() => {
    // 取消删除时的处理
    console.log('取消删除所有记录');
  });
};
// 删除所有记录
const deleteRecord0 = async (record) => {
  const formData = new FormData();
  formData.append('UserID', record.user_id); // 假设 UserID 是 13，您可以根据需要动态获取
  formData.append('RecordID', record.id); // 假设 record.id 是要删除的记录的 ID
  try {
    // 发送删除请求
    await axios.post("http://110.42.214.164:8000/delete_upload_history_user", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    // 从 tableData 中删除记录
    const index = tableData.value.indexOf(record);
    if (index !== -1) {
      tableData.value.splice(index, 1);
    }
  } catch (error) {
    console.error('删除记录失败:', error);
    ElMessageBox.alert('删除记录失败，请重试', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    });
  }
};

const deleteAllRecords = async () => {
  const deletePromises = tableData.value.map(record => deleteRecord0(record)); // 创建所有删除请求的数组
  try {
    await Promise.all(deletePromises); // 并行执行所有删除请求
    tableData.value = []; // 清空表格数据
    ElMessageBox.alert('所有记录已成功删除', '提示', {
      confirmButtonText: '确定',
      type: 'success'
    });
  } catch (error) {
    console.error('删除所有记录失败:', error);
    ElMessageBox.alert('删除所有记录失败，请重试', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    });
  }
};

</script>

<style>
.history-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
  position: relative; /* 使得绝对定位的按钮相对于这个容器 */
}

.back-to-main-btn {
  margin: 5px;
  align-self: flex-end;
}

.result-wrap {
  width: 100%;         /* 水平方向布满窗口 */
  height: 75vh;       /* 竖直方向占据整个屏幕的四分之三 */
  overflow-y: auto;   /* 允许垂直滚动 */
  margin-top: 8vh;
}

.delete-all-btn {
  width: 100px; /* 可以根据需要调整按钮宽度 */
  align-self: center; /* 使按钮居中 */
  position: absolute; /* 绝对定位 */
  bottom: 20px; /* 距离底部20px */
  left: 50%; /* 水平居中 */
  transform: translateX(-50%); /* 使按钮完全居中 */
}

.custom-delete-confirm .el-button--primary {
  order: 1; /* 确认按钮在左侧 */
}

.custom-delete-confirm .el-button--default {
  order: 2; /* 取消按钮在右侧 */
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