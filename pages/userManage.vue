<template>
  <div class="page">
    <!-- 权限表格 -->
    <div class="table_container">
      <el-table
          border
          :data="itemList"
          style="width: 100%"
          :table-layout="auto"
      >
        <el-table-column prop="email" label="Email"></el-table-column>
        <el-table-column label="是否为管理员">
          <template #default="{ row }">
            <el-switch
                v-model="row.is_superuser"
                @change="() => handleSwitchChange(row, 'is_superuser','table')"
            ></el-switch>
          </template>
        </el-table-column>
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
        <el-table-column label="震动数据检测权限" prop="access_system_e">
          <template #default="{ row }">
            <el-switch
                v-model="row.access_system_e"
                @change="() => handleSwitchChange(row, 'access_system_e','table')"
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
        <el-table-column label="幕墙韧性评估权限" prop="access_system_g">
          <template #default="{ row }">
            <el-switch
                v-model="row.access_system_h"
                @change="() => handleSwitchChange(row, 'access_system_h','table')"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="金属锈蚀检测权限" prop="access_system_g">
          <template #default="{ row }">
            <el-switch
                v-model="row.access_system_h"
                @change="() => handleSwitchChange(row, 'access_system_z','table')"
            ></el-switch>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
/**
 * Vue组件逻辑
 * 本部分处理组件的状态管理和与后端的交互。
 */
import {ref, reactive, onMounted, nextTick} from "vue";
import axios from "axios";

/**
 * permissions: 权限选项列表。
 */

const permissions = [
  {
    value: 'is_superuser',
    label: '是否为管理员',
  },
  {
    value: 'access_system_a',
    label: '3D模型权限',
  },
  {
    value: 'access_system_b',
    label: '石材污渍权限',
  },
  {
    value: 'access_system_c',
    label: '石材裂缝权限',
  },
  {
    value: 'access_system_d',
    label: '玻璃自爆检测权限',
  },
  {
    value: 'access_system_e',
    label: '震动数据检测权限',
  },
  {
    value: 'access_system_f',
    label: '幕墙材质分割权限',
  },
  {
    value: 'access_system_g',
    label: '玻璃平整度权限',
  },
  {
    value: 'access_system_h',
    label: '幕墙韧性评估权限',
  },
  {
    value: 'access_system_z',
    label: '金属锈蚀权限',
  },
]

const itemList = ref([]);

/**
 * handleSwitchChange
 * 处理权限开关的变化。
 * 输入： 
 *   - item: 包含用户信息的对象。
 *   - key: 权限的键名。
 *   - updatemethod: 更新方法，指示更新的来源。
 * 输出：
 *   - 调用接口更新权限。
 */
const handleSwitchChange = async (item, key, updatemethod) => {
  // 判断是否为管理员并且管理员权限不可更改，仅可更改管理员权限
  if (item.is_superuser && key !== 'is_superuser') {
    ElMessage.warning("管理员固定获得全部权限，不可修改");
    await nextTick();
    item[key] = !item[key];
    return; // 提前返回，不执行更多操作
  }
  const dataToSend = {
    [item.email]: {
      // 使用动态键名设置邮箱地址
      [key]: item[key], // 设置对应权限的新值
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
    setTimeout(() => {
      location.reload();
    }, 1000);
  } catch (error) {
    console.error(error);
    if (updatemethod == "email") {
      ElMessage.error("邮箱不存在，或权限已满足要求，无需修改");
    } else {
      ElMessage.error("权限修改出错");
    }
  }
};

/**
 * getAllPermission
 * 获取所有用户权限并更新itemList。
 * 输入：
 *   - 无
 * 输出：
 *   - 更新itemList以展示用户权限。
 */
const getAllPermission = async () => {
  try {
    const authToken = localStorage.getItem("authToken");
    const response = await axios.get("/api/account/super/getAllPermissions", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (response.status === 200) {
      console.log("Permissions:", response);
      itemList.value = Object.entries(response.data.data).map(
          ([email, permissions]) => ({
            email,
            ...permissions, 
          })
      );
      // console.log(itemList.value)
    } else {
      console.error("Failed to fetch permissions:", response);
      ElMessage.error("获取权限失败");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      console.error("Error:", message);
      ElMessage.error(message);
    } else {
      console.error("Unexpected error:", error);
      ElMessage.error("未预料到的错误");
    }
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
  justify-content: center;
  margin-top: 4em; 
  padding: 1em; 
  overflow: auto;
  height: 85vh;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

</style>
