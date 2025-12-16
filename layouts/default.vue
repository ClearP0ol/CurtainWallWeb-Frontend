<template>
  <UDashboardLayout>
    <UDashboardPanel :width="250" :resizable="{ min: 200, max: 300 }" collapsible>
      <UDashboardNavbar class="!border-transparent" :ui="{ left: 'flex-1' }">
        <template #left>
          <WebInfo/>

        </template>
      </UDashboardNavbar>

      <UDashboardSidebar>
        <template #header>
          <UDashboardSearchButton/>
        </template>

        <UDashboardSidebarLinks :links="links"/>

        <UDivider/>

        <!--
        <UDashboardSidebarLinks :links="[{ label: 'Colors', draggable: true, children: colors }]" @update:links="(colors: any) => defaultColors = colors" />
        -->
        <div class="flex-1"/>

        <UDashboardSidebarLinks :links="footerLinks"/>

        <UDivider class="sticky bottom-0"/>

        <template #footer>
          <!-- ~/components/UserDropdown.vue -->
          <UserDropdown/>
        </template>
      </UDashboardSidebar>
    </UDashboardPanel>

    <slot/>

    <!-- ~/components/HelpSlideover.vue -->
    <HelpSlideover/>
    <!-- ~/components/NotificationsSlideover.vue -->
    <!-- <NotificationsSlideover /> -->

    <ClientOnly>
      <LazyUDashboardSearch :groups="groups"/>
    </ClientOnly>
  </UDashboardLayout>
</template>

<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {onMounted} from "vue";
import axios from "axios";

const route = useRoute();
const router = useRouter();
const appConfig = useAppConfig();
const {isHelpSlideoverOpen} = useDashboard();

// definePageMeta({
//   middleware: "slidebar-renew",
// });

const userPermissions = ref({
  is_superuser: false,
  access_system_a: false,
  access_system_b: false,
  access_system_c: false,
  access_system_d: false,
  access_system_v: false,
  access_system_f: false,
  access_system_g: false,
  access_system_h: false,
  access_system_z: false,
});



const links = reactive([
  {
    id: "home",
    label: "首页",
    icon: "i-heroicons-home",
    to: "/",
    tooltip: {
      text: "首页",
      shortcuts: ["G", "H"],
    },
  },
  {
    id: "wind",
    label: "幕墙振动监测",
    icon: "i-simple-icons-tailwindcss",
    to: "/monitor",
    defaultOpen: false,
    children: [
      {
        id: "monitor",
        label: "监测中心",
        icon: "i-heroicons-chart-bar-square",
        to: "/vibration",
        defaultOpen: false,
        tooltip: {
          text: "监测中心",
          shortcuts: ["G", "M"],
        },
        children: [
          {
            label: "仪表盘",
            to: "/vibration/dashboard",
          },
          {
            label: "实时监测",
            to: "/vibration",
            exact: true,
          },
          {
            label: "参数设置",
            to: "/vibration/parameter",
          },
          {
            label: "异常数据",
            to: "/vibration/abnormal",
          },

        ],
      },
    ],
    tooltip: {
      text: "震动数据检测",
    },
  },
  {
    id: "stoneCrack",
    label: "石材裂缝检测",
    icon: "i-simple-icons-affinitypublisher",
    to: "/crackdetect",
    defaultOpen: false,
    children: [
      {
        label: "检测中心",
        to : "/crackdetect",
        exact: true,
      },
      {
        label:"历史记录",
        to : "/crackdetect/history",
      },
      {
        label: "数据集一览",
        to: "/crackdetect/datasets",
      }
    ]
  },

  {
    id: "resilienceAssessment",
    label: "幕墙性能评估",
    icon: "i-simple-icons-testcafe",
    to: "/resilience",
    defaultOpen: false,
    children: [
      {
        id: "dataset",
        label: "数据集管理",
        icon: "heroicons-solid:database",
        to: "/resilience/views/DataSetsView",
        defaultOpen: false,
        tooltip: {
          text: "数据集管理",
          shortcuts: ["G", "M"],
        }
      },
      {
        id: "analysisJob",
        label: "分析任务",
        icon: "heroicons-solid:calculator",
        to: "/resilience/views/DataSetsView",
        defaultOpen: false,
        tooltip: {
          text: "分析任务",
          shortcuts: ["G", "M"],
        },
        children: [
          {
            label: "模型列表",
            to: "/resilience/views/AnalysisModelsView",
          },
          {
            label: "任务管理",
            to: "/resilience/views/AnalysisJobView",
            exact: true,
          },
        ],
      },
      {
        id: "visualization",
        label: "可视化",
        icon: "heroicons-solid:computer-desktop",
        to: "/resilience/visualization",
        defaultOpen: false,
        tooltip: {
          text: "可视化",
          shortcuts: ["G", "M"],
        },
        children: [
          {
            label: "聚类分析",
            to: "/resilience/views/VisualizationClusterView",
          },
          {
            label: "雷达图",
            to: "/resilience/views/VisualizationRadarView",
          },
          {
            label: "热力图",
            to: "/resilience/views/VisualizationHeatMapView",
          },
          {
            label: "剖面分析",
            to: "/resilience/views/VisualizationSliceView",
          },
        ],
      },
      {
        id: "reports",
        label: "报告管理",
        icon: "heroicons-solid:document-report",
        to: "/resilience/reports",
        defaultOpen: false,
        tooltip: {
          text: "报告管理",
          shortcuts: ["G", "M"],
        },
        children: [
          {
            label: "报告生成",
            to: "/resilience/views/ReportsGenerateView",
          },
          {
            label: "历史报告",
            to: "/resilience/views/ReportsHistoryView",
            exact: true,
          },
        ],
      },
    ],
    tooltip: {
      text: "幕墙韧性评估",
    },
  },


  {
    id: "stoneDirty",
    label: "石材污渍检测",
    to: "/stonedirty/mainpage",
    icon: "i-heroicons-fire",
    tooltip: {
      text: "石材污渍检测",
    },
    defaultOpen: false,
    children: [
      {
        label: "上传图片",
        to: "/stonedirty/mainpage",
        exact: true,
      },
      {
        label: "历史图片",
        to: "/stonedirty/otherpage",
      },
    ],

  },
  {
    id: "userManage",
    label: "用户管理",
    to: "/userManage",
    icon: "i-heroicons-book-open",
    tooltip: {
      text: "用户管理",
    },
  },
]);

const userAuth = ref({
  is_superuser: false,
  access_system_a: false,
  access_system_b: false,
  access_system_c: false,
  access_system_d: false,
  access_system_v: false,
  access_system_f: false,
  access_system_g: false,
  access_system_h: false,
  access_system_z: false,
});

function removeLinkById(linkId: any) {
  console.log("removeLink");
  const index = links.findIndex((link) => link.id === linkId);
  if (index !== -1) {
    links.splice(index, 1); // 使用 splice 确保响应性保持
  }
}

const getUserAuth = async () => {
  try {
    const authToken = localStorage.getItem("authToken");
    const response = await axios.get("/api/account/custom/getPermissions", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    userAuth.value = response.data.data;
    console.log("✅ 侧边栏权限信息:", userAuth.value);
    
    // 管理员可以看到所有菜单
    if (userAuth.value.is_superuser) {
      console.log("✅ 管理员身份，显示所有侧边栏菜单");
      return;
    }
    
    // 根据权限移除对应的侧边栏菜单项
    if (!userAuth.value.access_system_a) {
      removeLinkById("3DBuildingModel");
      removeLinkById("resilienceAssessment"); // 幕墙性能评估
      console.log("❌ 无 access_system_a 权限，移除 3D模型 和 幕墙性能评估");
    }
    if (!userAuth.value.access_system_b) {
      removeLinkById("stoneDirty");
      console.log("❌ 无 access_system_b 权限，移除石材污渍检测");
    }
    if (!userAuth.value.access_system_c) {
      removeLinkById("stoneCrack");
      console.log("❌ 无 access_system_c 权限，移除石材裂缝检测");
    }
    if (!userAuth.value.access_system_d) {
      removeLinkById("explosion");
      console.log("❌ 无 access_system_d 权限，移除玻璃自爆检测");
    }
    if (!userAuth.value.access_system_v) {
      removeLinkById("wind");
      console.log("❌ 无 access_system_v 权限，移除幕墙振动监测");
    }
    if (!userAuth.value.access_system_f) {
      removeLinkById("segment");
      console.log("❌ 无 access_system_f 权限，移除幕墙材质分割");
    }
    if (!userAuth.value.access_system_g) {
      removeLinkById("glassFlatness");
      console.log("❌ 无 access_system_g 权限，移除玻璃平整度检测");
    }
    if (!userAuth.value.access_system_h) {
      removeLinkById("glassToughnessJudge");
      console.log("❌ 无 access_system_h 权限，移除幕墙韧性评估");
    }
    if (!userAuth.value.access_system_z) {
      removeLinkById("corrosiondetection");
      console.log("❌ 无 access_system_z 权限，移除金属锈蚀检测");
    }
    if (!userAuth.value.is_superuser) {
      removeLinkById("userManage");
      console.log("❌ 非管理员，移除用户管理");
    }
  } catch (error) {
    console.error("❌ 获取用户权限失败:", error);
    ElMessage.error("获取用户权限失败");
  }
};
getUserAuth();

onMounted(() => {
  getUserAuth();
});

const footerLinks = [
  {
    label: "帮助与支持",
    icon: "i-heroicons-question-mark-circle",
    click: () => (isHelpSlideoverOpen.value = true),
  },
];

const groups = computed(() => [
  {
    key: "links",
    label: "Go to",
    commands: links.map((link) => ({
      ...link,
      shortcuts: link.tooltip?.shortcuts,
    })),
  },
  {
    key: "code",
    label: "Code",
    commands: [
      {
        id: "source",
        label: "GitHub",
        icon: "i-simple-icons-github",
        click: () => {
          window.open(
              `https://github.com/CurtainWallMonitoringPlatform`,
              "_blank"
          );
        },
      },
    ],
  },
]);

const defaultColors = ref(
    ["green", "teal", "cyan", "sky", "blue", "indigo", "violet"].map((color) => ({
      label: color,
      chip: color,
      click: () => (appConfig.ui.primary = color),
    }))
);
const colors = computed(() =>
    defaultColors.value.map((color) => ({
      ...color,
      active: appConfig.ui.primary === color.label,
    }))
);

const backToMain = () => {
  router.push("/");
};
</script>

<style>
.back-to-main-btn {
  margin: 5px;
  align-self: flex-end;
  /* 对齐到容器的左侧 */
}
</style>
