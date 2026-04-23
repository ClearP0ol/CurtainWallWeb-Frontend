<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar title="首页" />

      <div class="main-page">
        <UPageGrid class="custom-margin">
          <UPageCard
            v-for="(module, index) in modulesLine1"
            :key="index"
            v-bind="module"
            @click="checkPermissionAndRedirect(module)"
            class="hover-effect bg-blue-100 dark:bg-slate-800"
          >
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

          <UPageCard
            v-for="(module, index) in modulesLine2"
            :key="index"
            v-bind="module"
            @click="checkPermissionAndRedirect(module)"
            class="hover-effect bg-blue-100 dark:bg-slate-800"
          >
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

          <UPageCard
            v-for="(module, index) in modulesLine3"
            :key="index"
            v-bind="module"
            @click="checkPermissionAndRedirect(module)"
            class="hover-effect bg-blue-100 dark:bg-slate-800"
          >
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
        </UPageGrid>
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<script setup>
import axios from "axios";
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";

const router = useRouter();
const userAuth = ref({});
const loadingAuth = ref(true);

const modulesLine1 = reactive([
  {
    title: "幕墙振动监测",
    description:
      "结合实时振动数据、环境因素和模型基线，对 X/Y/Z 或应变通道进行监测、分析与三级预警。",
    target_address: "/vibration/dashboard",
    permissionKey: "access_system_v",
    icon: "i-simple-icons-tailwindcss",
  },
  {
    title: "石材裂缝检测",
    description: "识别建筑石材幕墙表面的裂缝并生成检测记录。",
    target_address: "/crackdetect",
    permissionKey: "access_system_c",
    icon: "i-simple-icons-affinitypublisher",
  },
]);

const modulesLine2 = reactive([
  {
    title: "幕墙韧性评估",
    description: "对幕墙多维数据进行分析、评估和风险预警。",
    target_address: "/resilience/views/DataSetsView",
    permissionKey: "access_system_a",
    icon: "i-simple-icons-testcafe",
  },
  {
    title: "石材污渍检测",
    description: "识别建筑石材幕墙表面污渍并输出检测结果。",
    target_address: "/stonedirty/mainpage",
    permissionKey: "access_system_b",
    icon: "i-heroicons-fire",
  },
]);

const modulesLine3 = reactive([
  {
    title: "用户管理",
    description: "管理用户账号与各子系统访问权限。",
    target_address: "/userManage",
    permissionKey: "manage",
    icon: "i-heroicons-book-open",
  },
]);

const getUserAuth = async () => {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      userAuth.value = {};
      return;
    }

    const response = await axios.get("/api/account/custom/getPermissions", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    userAuth.value = response.data.data || {};
  } catch (error) {
    console.error("获取权限失败:", error);
    userAuth.value = {};
  }
};

const checkPermissionAndRedirect = (module) => {
  if (loadingAuth.value) {
    ElMessage.warning("权限信息加载中，请稍后再试。");
    return;
  }

  if (!module.permissionKey) {
    router.push({ path: module.target_address });
    return;
  }

  if (module.permissionKey === "manage" && userAuth.value.is_superuser) {
    router.push({ path: module.target_address });
    return;
  }

  if (userAuth.value.is_superuser || userAuth.value[module.permissionKey]) {
    router.push({ path: module.target_address });
  } else {
    ElMessage.error("当前账号没有访问该模块的权限。");
  }
};

onMounted(async () => {
  await getUserAuth();
  loadingAuth.value = false;
});
</script>

<style scoped>
::v-deep(.u-page-card .text-3xl) {
  font-size: 36px !important;
}

::v-deep(.u-page-card .text-primary) {
  font-size: 20px !important;
  font-weight: 700 !important;
}

.main-page {
  overflow: auto;
}

.custom-margin {
  margin: 50px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 50px;
}

.hover-effect:hover {
  background-color: #f0f0f0;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}
</style>
