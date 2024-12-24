<template>
  <el-table
    v-loading="loading"
    style="width: 100%; height: 100%"
    element-loading-text="数据计算中，请稍后..."
  >
    <el-table-column />
  </el-table>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { useRoute } from 'vue-router';


const route = useRoute();
const router = useRouter();
const loading = ref(true);

// 从路径中获取 batchID 参数
const currentPath = window.location.pathname;
const batchID = parseInt(route.query.batchID as string, 10); // 解析 `batchID`

onMounted(async () => {
  try {
  const headers = { "Content-Type": "application/json" }; // 公共请求头

  // 调用第一个接口
  console.log("调用第一个接口: /evalu/entropy");
  console.log("发送的 batchID:", batchID);
  const response1 = await axios.post(
    `http://110.42.214.164:8005/evalu/entropy?batch=${batchID}`, // 通过查询参数传递
    {}, // 请求体为空
    { headers: { "Content-Type": "application/json" } } // 设置正确的请求头
  );
  console.log("第一个接口返回:", response1.data); // 打印返回结果

  // 检查第一个接口的返回结果
  if (!response1.data || response1.data.code !== 200) {
    ElMessage.error(
      (response1.data?.message || "未知错误") + "，错误码：" + (response1.data?.code || "未知")
    );
    setTimeout(() => {
      router.push("/resilienceAssessment/dataUpload"); // 跳转到主页面
    }, 2000);
    return; // 停止后续代码执行
  }

  // 调用第二个接口
  console.log("调用第二个接口: /evalu/roughset");
  console.log("发送的 batchID:", batchID);
  const response2 = await axios.post(
  `http://110.42.214.164:8005/evalu/entropy?batch=${batchID}`, // 通过查询参数传递
    {}, // 请求体为空
    { headers: { "Content-Type": "application/json" } } // 设置正确的请求头
  );
  console.log("第二个接口返回:", response2.data); // 打印返回结果

  // 检查第二个接口的返回结果
  if (!response2.data || response2.data.code !== 200) {
    ElMessage.error(
      (response2.data?.message || "未知错误") + "，错误码：" + (response2.data?.code || "未知")
    );
    setTimeout(() => {
      router.push("/resilienceAssessment/dataUpload"); // 跳转到主页面
    }, 2000);
    return; // 停止后续代码执行
  }

  // 如果两个接口都成功，执行后续逻辑
  console.log("两个接口均调用成功");
  router.push("/resilienceAssessment/dangerAssess"); // 跳转到目标页面
} catch (err) {
  console.error("捕获的错误对象:", err);

  // 判断是否是后端返回的错误
  if (err.response) {
    console.error("后端返回的错误:", err.response.data); // 打印后端的错误信息
    ElMessage.error(err.response.data?.detail?.[0]?.msg || "请求失败，请检查参数");
  } else if (err.request) {
    // 如果没有收到后端响应
    console.error("请求未发送成功:", err.request);
    ElMessage.error("请求未发送成功，请检查网络连接");
  } else {
    ElMessage.error("网络错误，请稍后重试");
  }

  // 错误发生后，跳转回主页面
  setTimeout(() => {
    router.push("/resilienceAssessment/dataUpload");
  }, 2000);
}


});
</script>
