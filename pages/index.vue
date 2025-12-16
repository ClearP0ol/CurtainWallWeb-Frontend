<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="首页"></UDashboardNavbar>
      <div class="main-page">
        <UPageGrid class="custom-margin">
          <UPageCard v-for="(module, index) in modulesLine1" :key="index" v-bind="module"
                     @click="checkPermissionAndRedirect(module)" class="hover-effect bg-blue-100 dark:bg-slate-800"   >
                     <template #icon>
                      <UIcon :name="module.icon" class="text-[48px] text-primary" />
                     </template>

                     <template #title>
                       <span class="text-[24px] font-bold">{{ module.title }}</span>
                     </template>

                     <template #description>
                       <span class="line-clamp-2">{{ module.description }}</span>
                     </template>
          </UPageCard>

          <UPageCard v-for="(module, index) in modulesLine2" :key="index" v-bind="module"
                     @click="checkPermissionAndRedirect(module)" class="hover-effect bg-blue-100 dark:bg-slate-800" >
                     <template #icon>
                      <UIcon :name="module.icon" class="text-[48px] text-primary" />
                     </template>

                     <template #title>
                       <span class="text-[24px] font-bold">{{ module.title }}</span>
                     </template>

                     <template #description>
                       <span class="line-clamp-2">{{ module.description }}</span>
                     </template>
          </UPageCard>
          <UPageCard v-for="(module, index) in modulesLine3" :key="index" v-bind="module"
                     @click="checkPermissionAndRedirect(module)" class="hover-effect bg-blue-100 dark:bg-slate-800" >
                     <template #icon>
                      <UIcon :name="module.icon" class="text-[48px] text-primary" />
                     </template>

                     <template #title>
                       <span class="text-[24px] font-bold">{{ module.title }}</span>
                     </template>

                     <template #description>
                       <span class="line-clamp-2">{{ module.description }}</span>
                     </template>
          </UPageCard>
          <UPageCard v-for="(module, index) in modulesLine4" :key="index" v-bind="module"
                     @click="checkPermissionAndRedirect(module)" class="hover-effect bg-blue-100 dark:bg-slate-800" >
            <template #description>
              <span class="line-clamp-2">{{ module.description }}</span>
            </template>
          </UPageCard>
          <UPageCard v-for="(module, index) in modulesLine5" :key="index" v-bind="module"
                     @click="checkPermissionAndRedirect(module)" class="hover-effect bg-blue-100 dark:bg-blue-800" >
            <template #description>
              <span class="line-clamp-2">{{ module.description }}</span>
            </template>
          </UPageCard>
        </UPageGrid>
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<script setup>
import axios from "axios";
import {ref, reactive} from "vue";
import {ElMessage} from "element-plus";
import {useRouter} from "vue-router";

const router = useRouter();
const userAuth = ref({});

//definePageMeta({
//  middleware: "auth",
//});



const modulesLine1 = reactive([

  {
    title: "幕墙振动监测",
    description: "用于检测和展示幕墙的振动数据",
    target_address: "/vibration/dashboard",
    permissionKey: "access_system_v",
    icon: "i-simple-icons-tailwindcss",
  },
  {
    title: "石材裂缝检测",
    description: "用于识别建筑石材幕墙表面裂缝",
    target_address: "/crackdetect",
    permissionKey: "access_system_c",
    icon: "i-simple-icons-affinitypublisher",
  },




]);

const modulesLine2 = reactive([
  {
    title: "幕墙性能评估",
    description: "用于幕墙韧性多维数据分析评估和预警",
    target_address: "/resilience/views/DataSetsView",
    permissionKey: "access_system_a",
    icon: "i-simple-icons-testcafe",
  },
  {
    title: "石材污渍检测",
    description: "用于识别建筑石材幕墙表面污渍",
    target_address: "/stonedirty/mainpage",
    icon: "i-heroicons-fire",
    permissionKey: "access_system_b",
  },

]);

const modulesLine3 = reactive([

  {
    title: "用户管理",
    description: "管理用户权限",
    target_address: "/userManage",
    permissionKey: "manage",
    icon: "i-heroicons-book-open",
    disabled: true,
  },

]);

const modulesLine4 = reactive([]);
const modulesLine5 = reactive([]);

const loadingAuth = ref(true); // 新增loading状态

onMounted(async () => {
  await getUserAuth();
  loadingAuth.value = false; // 权限加载完成
});

const getUserAuth = async () => {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.warn("❌ authToken 不存在，跳转登录");
      router.push('/login');
      return;
    }

    // 先尝试从本地获取权限
    const cachedAuth = localStorage.getItem("userAuth");
    if (cachedAuth) {
      try {
        userAuth.value = JSON.parse(cachedAuth);
        console.log("✅ 使用缓存的权限信息:", userAuth.value);
      } catch (e) {
        console.error("❌ 权限缓存解析失败:", e);
      }
    }

    // 从服务器刷新权限信息
    const response = await axios.get("/api/account/custom/getPermissions", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (response.data && response.data.data) {
      userAuth.value = response.data.data;
      localStorage.setItem("userAuth", JSON.stringify(userAuth.value));
      console.log("✅ 权限信息已更新:", userAuth.value);
    } else {
      throw new Error('权限数据格式错误');
    }
  } catch (error) {
    console.error("❌ 获取权限失败:", error);
    // 如果是401错误，说明token过期
    if (error.response?.status === 401) {
      ElMessage.error("登录已过期，请重新登录");
      localStorage.removeItem("authToken");
      localStorage.removeItem("userAuth");
      localStorage.removeItem("email");
      router.push('/login');
    } else {
      userAuth.value = {};
      ElMessage.error("权限获取失败，部分功能可能无法使用");
    }
  }
};

const checkPermissionAndRedirect = (module) => {
  if (loadingAuth.value) {
    ElMessage.warning("权限信息加载中，请稍后...");
    return;
  }
  
  // 检查是否有权限信息
  if (!userAuth.value || Object.keys(userAuth.value).length === 0) {
    ElMessage.error("权限信息丢失，请重新登录");
    router.push('/login');
    return;
  }

  // 无需权限的模块
  if (module.permissionKey == "") {
    router.push({ path: module.target_address });
    return;
  }
  
  // 管理员权限
  if (module.permissionKey == "manage" && userAuth.value.is_superuser) {
    router.push({ path: module.target_address });
    return;
  }
  
  // 检查具体权限
  if (userAuth.value.is_superuser || userAuth.value[module.permissionKey]) {
    console.log(`✅ 允许访问 ${module.title}`);
    router.push({ path: module.target_address });
  } else {
    console.log(`❌ 无权限访问 ${module.title}，需要: ${module.permissionKey}`);
    ElMessage.error(`您没有权限访问"${module.title}"模块`);
  }
};
</script>

<style scoped>

/* 放大图标大小 */
::v-deep(.u-page-card .text-3xl) {
  font-size: 36px !important; /* 默认约为24px，这里放大到36px */
}

/* 放大标题字体 */
::v-deep(.u-page-card .text-primary) {
  font-size: 20px !important;
  font-weight: 700 !important;
}


.main-page {
  overflow: auto
}

.custom-margin {
  margin: 50px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); /* 这里280px是每列的最小宽度 */
  gap: 50px; /* 卡片间距 */
}

.hover-effect:hover {
  background-color: #f0f0f0;
  cursor: pointer;
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
}

.back-to-main-btn {
  margin: 5px;
  align-self: flex-end;
  /* 对齐到容器的左侧 */
}
</style>
