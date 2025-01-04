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
        <UDashboardNavbar title="选择子模块" :badge="total"> </UDashboardNavbar>
        <UPageGrid class="custom-margin">
            <UPageCard v-for="(module, index) in modulesLine" :key="index" v-bind="module"
                        @click="redirect(module)" class="hover-effect">
                <template #description>
                <span class="line-clamp-2">{{ module.description }}</span>
                </template>
          </UPageCard>
        </UPageGrid>
      </UDashboardPanel>
    </UDashboardPage>
</template>  


<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from 'axios';
const total = ref(0);
const router = useRouter();
const backToMain = () => {
  router.push("/");
};

// 添加接口定义
interface Module {
  title: string;
  description: string;
  target_address: string;
  permissionKey: string;
  icon: string;
}

const modulesLine = reactive([
  {
    title: "监测中心",
    description: "实时检测建筑风振数据",
    // to: "",
    target_address: "/vibration",
    permissionKey: "access_system_e",
    icon: "i-simple-icons-tailwindcss",
  },
  {
    title: "报警中心",
    description: "报告异常风振情况",
    // to: "",
    target_address: "/alarm",
    permissionKey: "access_system_e",
    icon: "i-simple-icons-tailwindcss",
  },
  {
    title: "智能助手",
    description: "生成数据报告",
    target_address: "/bot",
    permissionKey: "access_system_e",
    icon: "i-heroicons-cpu-chip",
  }
]);

const redirect = (module: Module) => {
  // if (userAuth.value.is_superuser || userAuth.value[module.permissionKey]) {
      router.push({path: module.target_address}); // 使用router.push进行跳转
};
</script>

<style>

.custom-margin {
  margin: 20px;
}
</style>