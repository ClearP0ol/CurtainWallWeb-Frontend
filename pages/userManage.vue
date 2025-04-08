<template>
  <div class="page">
    <div class="search_container">
      <el-input
        v-model="searchInput"
        placeholder="请输入用户邮箱"
        clearable
        style="width: 300px; margin-right: 10px"
        @keyup.enter="getAllPermission"
      ></el-input>
      <el-button type="primary" @click="getAllPermission">搜索</el-button>
    </div>

    <!-- 权限表格 -->
    <div class="table_container">
      <el-table
        border
        :data="paginatedList"
        style="width: 100%"
        :table-layout="auto"
      >
        <el-table-column prop="email" label="Email"></el-table-column>
        <el-table-column label="3D模型权限" prop="access_system_a">
          <template #default="{ row }">
            <el-switch
              v-model="row.access_system_a"
              @change="() => handleSwitchChange(row, 'access_system_a','table')"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="石材污渍权限" prop="access_system_b">
          <template #default="{ row }">
            <el-switch
              v-model="row.access_system_b"
              @change="() => handleSwitchChange(row, 'access_system_b','table')"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="石材裂缝权限" prop="access_system_c">
          <template #default="{ row }">
            <el-switch
              v-model="row.access_system_c"
              @change="() => handleSwitchChange(row, 'access_system_c','table')"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="玻璃自爆检测权限" prop="access_system_d">
          <template #default="{ row }">
            <el-switch
              v-model="row.access_system_d"
              @change="() => handleSwitchChange(row, 'access_system_d','table')"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="震动数据检测权限" prop="access_system_v">
          <template #default="{ row }">
            <el-switch
              v-model="row.access_system_v"
              @change="() => handleSwitchChange(row, 'access_system_v','table')"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="幕墙材质分割权限" prop="access_system_f">
          <template #default="{ row }">
            <el-switch
              v-model="row.access_system_f"
              @change="() => handleSwitchChange(row, 'access_system_f','table')"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="玻璃平整度权限" prop="access_system_g">
          <template #default="{ row }">
            <el-switch
              v-model="row.access_system_g"
              @change="() => handleSwitchChange(row, 'access_system_g','table')"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="幕墙韧性评估权限" prop="access_system_h">
          <template #default="{ row }">
            <el-switch
              v-model="row.access_system_h"
              @change="() => handleSwitchChange(row, 'access_system_h','table')"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="金属锈蚀检测权限" prop="access_system_z">
          <template #default="{ row }">
            <el-switch
              v-model="row.access_system_z"
              @change="() => handleSwitchChange(row, 'access_system_z','table')"
            ></el-switch>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <el-pagination
        background
        layout="prev, pager, next"
        :total="itemList.length"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="val => currentPage = val"
        style="margin: 1em auto; text-align: center;"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import axios from "axios";

const searchInput = ref("");
const itemList = ref([]);
const currentPage = ref(1);
const pageSize = 10;

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return itemList.value.slice(start, end);
});

const handleSwitchChange = async (item, key, updatemethod) => {
  if (item.is_superuser && key !== 'is_superuser') {
    ElMessage.warning("管理员固定获得全部权限，不可修改");
    await nextTick();
    item[key] = !item[key];
    return;
  }

  const dataToSend = {
    [item.email]: {
      [key]: item[key],
      method: updatemethod,
    },
  };

  try {
    const response = await $fetch("/api/account/super/updatePermission", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: dataToSend,
    });
    ElMessage.success("权限修改成功");
    itemList.value = itemList.value.map(user =>
      user.email === item.email ? { ...user, [key]: item[key] } : user
    );
  } catch (error) {
    console.error(error);
    if (updatemethod === "email") {
      ElMessage.error("邮箱不存在，或权限已满足要求，无需修改");
    } else {
      ElMessage.error("权限修改出错");
    }
  }
};

const getAllPermission = async () => {
  try {
    const authToken = localStorage.getItem("authToken");
    const queryParam = searchInput.value ? `?username=${searchInput.value}` : "";
    const response = await axios.get(`/api/account/super/getUserPermissions${queryParam}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.status === 200) {
      const data = response.data.data;
      itemList.value = Object.entries(data).map(([email, permissions]) => ({
        email,
        ...permissions,
      }));
      currentPage.value = 1; // 搜索后重置页码
    } else {
      ElMessage.error("获取权限失败");
    }
  } catch (error) {
    const msg = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : "未预料到的错误";
    console.error("Error:", msg);
    ElMessage.error(msg);
  }
};

getAllPermission();
</script>

<style scoped>
.page {
  background-size: cover;
  height: 100%;
  width: 100%;
}

.table_container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 4em;
  padding: 1em;
  overflow: auto;
  height: 85vh;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.search_container {
  display: flex;
  justify-content: center;
  margin-top: 2em;
}
</style>
