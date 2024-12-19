<template>
  <div class="history-wrap" v-if="isAdmin">
    <div style="position: fixed; right: 120px; top: 10px; z-index: 1000; display: flex; align-items: center;">
      <el-input v-model="targetUser" placeholder="请输入用户ID或用户名" style="width: 200px; margin-right: 10px;"></el-input>
      <el-button type="primary" @click="fetchData">获取记录</el-button>
    </div>
    <div style="position: fixed; right: 10px; top: 10px; z-index: 1000;">
      <el-button type="primary" @click="backToMain"
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
  </div>
  <div v-else>
    <!-- 显示空白页面或提示信息 -->
    <el-message type="warning"></el-message>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from "vue-router";
import axios from 'axios'; // 确保引入 axios
import { ElMessageBox } from 'element-plus'; // 引入提示框组件

const tableData = ref([]); // 用于存储检测记录
const router = useRouter();
const targetUser = ref('');
const isAdmin = ref(false); // 用于判断是否为管理员

// 权限检查函数
const checkIfAdmin = async () => {
  try {
    const formData = new FormData();
    formData.append("UserID", '1');
    const response = await axios.post("http://110.42.214.164:8000/check_if_admin", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'html'
    });
    if (response.data === '1') {
      isAdmin.value = true; // 用户是管理员
    } else {
      isAdmin.value = false; // 用户不是管理员
      ElMessageBox.alert('由于权限限制，无法管理记录', '提示', {
        confirmButtonText: '确定',
        type: 'warning'
      });
    }
  } catch (error) {
    console.error('权限检查失败:', error);
    ElMessageBox.alert('权限检查失败，请重试', '错误', {
      confirmButtonText: '确定',
      type: 'error'
    });
  }
};

// 页面加载时进行权限检查
onMounted(() => {
  checkIfAdmin();
});

// 其他函数保持不变
const backToMain = () => {
  router.push("/");
};

const confirmDeleteRecord = (record) => {
  ElMessageBox.confirm('确定要删除吗？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
    customClass: 'custom-delete-confirm' // 添加自定义类
  }).then(() => {
    deleteRecord(record);
  }).catch(() => {
    console.log('取消删除');
  });
};

const deleteRecord = async (record) => {
  const formData = new FormData();
  formData.append('AdminUserID', '1');
  formData.append('TargetUserID', record.user_id);
  formData.append('RecordID', record.id);
  try {
    await axios.post("http://110.42.214.164:8000/delete_upload_history_admin", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
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

const fetchData = async () => {
  try {
    const formData = new FormData();
    formData.append('AdminUserID', '1');
    formData.append('TargetUserIDOrUsername', targetUser.value);
    const response = await axios.post("http://110.42.214.164:8000/get_upload_history_admin", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'json'
    });

    tableData.value = response.data.map(item => ({
      username: item.username,
      user_id: item.user_id,
      id: item.id,
      upload_time: item.upload_time,
      filename: item.filename,
    }));
  } catch (error) {
    console.error('获取数据失败:', error);
    alert('获取数据失败，请重试');
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
  position: relative;
}

.result-wrap {
  width: 100%;
  height: 75vh;
  overflow-y: auto;
  margin-top: 8vh;
}

.custom-delete-confirm .el-button--primary {
  order: 1;
}

.custom-delete-confirm .el-button--default {
  order: 2;
}

.el-button {
  background-color: #409eff; /* 设置初始背景颜色 */
  border-color: #409eff;
  color: white;
}

.el-button:hover {
  background-color: #a0cfff; /* 悬停时的背景颜色 */
  border-color: #a0cfff;
}

.el-table {
  width: 100%;
}

.el-table-column {
  text-align: center;
}

.el-table-column .cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>
