<template>
    <div class="main-container">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 5px; margin-right: 5px">
        <el-button type="primary" @click="backToMain">返回主页</el-button>
      </div>
      <div class="demo-image">
        <el-table :data="tableData" :border="parentBorder" style="width: 100%">
          <el-table-column prop="time" label="检测时间">
            <template #default="scope">
              <!-- 显示文字 -->
              <span>{{ scope.row.time }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="result" label="识别结果">
            <template #default="scope">
              <!-- 显示文字 -->
              <span>{{ scope.row.result }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="inputImg" label="原图">
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
  
  onMounted(async() => {
    //从localstorage获取token
    // const authToken = localStorage.getItem('authToken');
    // if(!authToken)
    // {
    //   ElMessage.error('请先登录');
    //   return;
    // }
    // console.log("authToken:",authToken);
    // // 解析token获取用户信息
    // const decoded =iwtDecode(authToken);
    // console.log("user name:",decoded.username);

    try {
      const response = await axios.get(`http://localhost:8080/flatness/history?username=zwj`);
      // 使用 Promise.all 来并发处理所有图片URL转换
      const processedTableData = await Promise.all(
          response.data.history.map(async (item) => {
            // 对于每个 item，发起另一个 API 请求来获取可预览的链接
            console.log(item);
            const InputResponse = await axios.get(item.inputImg, {
              responseType: 'blob', // 返回 blob 数据
            });
            // 创建一个对象 URL 用于图片预览
            const inputImageUrl = URL.createObjectURL(InputResponse.data);

            return {
              time: item.timestamp || '',
              result: item.result==0?"不平整":"平整",
              inputImg: inputImageUrl,
            };
          })
      );
      // 将处理后的数据赋值给 tableData
      tableData.value = processedTableData;
    } catch (error) {
      ElMessage.error('获取历史失败');
      console.error("获取历史失败", error);
    }
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
  