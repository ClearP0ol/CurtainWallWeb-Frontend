<template>
    <div class="app-container">
        <h2 class="title">手动输入数据</h2>
        <!-- 表单 -->
        <el-form ref="formRef" :model="form" label-width="120px">
            <el-form-item label="elasticityModulus">
            <el-input
                v-model="form.elasticityModulus"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('elasticityModulus', $event)"
            />
            </el-form-item>
    
            <el-form-item label="structuralAdhesiveStress">
            <el-input
                v-model="form.structuralAdhesiveStress"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('structuralAdhesiveStress', $event)"
            />
            </el-form-item>
    
            <el-form-item label="panelDamageArea">
            <el-input
                v-model="form.panelDamageArea"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('panelDamageArea', $event)"
            />
            </el-form-item>
    
            <el-form-item label="structuralAdhesiveDamageLength">
            <el-input
                v-model="form.structuralAdhesiveDamageLength"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('structuralAdhesiveDamageLength', $event)"
            />
            </el-form-item>
    
            <el-form-item label="connectorsNumber">
            <el-input
                v-model="form.connectorsNumber"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('connectorsNumber', $event)"
            />
            </el-form-item>
    
            <el-form-item label="backBoltsNumber">
            <el-input
                v-model="form.backBoltsNumber"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('backBoltsNumber', $event)"
            />
            </el-form-item>
    
            <el-form-item label="panelVerticality">
            <el-input
                v-model="form.panelVerticality"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('panelVerticality', $event)"
            />
            </el-form-item>
    
            <el-form-item label="stitchingWidth">
            <el-input
                v-model="form.stitchingWidth"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('stitchingWidth', $event)"
            />
            </el-form-item>
    
            <el-form-item label="panelSize">
            <el-input
                v-model="form.panelSize"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('panelSize', $event)"
            />
            </el-form-item>
    
            <el-form-item label="Offset_x">
            <el-input
                v-model="form.Offset_x"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('Offset_x', $event)"
            />
            </el-form-item>
    
            <el-form-item label="Offset_y">
            <el-input
                v-model="form.Offset_y"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('Offset_y', $event)"
            />
            </el-form-item>
    
            <el-form-item label="Offset_z">
            <el-input
                v-model="form.Offset_z"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('Offset_z', $event)"
            />
            </el-form-item>
    
            <el-form-item label="flatness">
            <el-input
                v-model="form.flatness"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('flatness', $event)"
            />
            </el-form-item>
    
            <el-form-item label="stains">
            <el-input
                v-model="form.stains"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('stains', $event)"
            />
            </el-form-item>
    
            <el-form-item label="cracks">
            <el-input
                v-model="form.cracks"
                placeholder="请输入数值"
                inputmode="decimal"
                @input="onInputNumber('cracks', $event)"
            />
            </el-form-item>
    
            <!-- 提交和清空按钮 -->
             
            <el-form-item>
            <el-button type="primary" round @click="onSubmit">添加</el-button>
            <el-button round @click="onCancel">清空</el-button>
            </el-form-item>
        </el-form>
        <!-- 数据表格 -->
        <h2 class="title">已添加数据</h2>
        <el-table :data="dataList" style="width: 100%" class="custom-table">
            <el-table-column type="index" label="序号" width="100" />
            <el-table-column label="elasticityModulus" prop="elasticityModulus" width="140" />
            <el-table-column label="structuralAdhesiveStress" prop="structuralAdhesiveStress" width="130" />
            <el-table-column label="panelDamageArea" prop="panelDamageArea" width="145" />
            <el-table-column label="structuralAdhesiveDamageLength" prop="structuralAdhesiveDamageLength" width="150" />
            <el-table-column label="connectorsNumber" prop="connectorsNumber" width="160" />
            <el-table-column label="backBoltsNumber" prop="backBoltsNumber" width="160" />
            <el-table-column label="panelVerticality" prop="panelVerticality" width="130" />
            <el-table-column label="stitchingWidth" prop="stitchingWidth" width="130" />
            <el-table-column label="panelSize" prop="panelSize" width="130" />
            <el-table-column label="Offset_x" prop="Offset_x" width="130" />
            <el-table-column label="Offset_y" prop="Offset_y" width="130" />
            <el-table-column label="Offset_z" prop="Offset_z" width="130" />
            <el-table-column label="flatness" prop="flatness" width="130" />
            <el-table-column label="stains" prop="stains" width="130" />
            <el-table-column label="cracks" prop="cracks" width="130" />
        </el-table>

        <el-button @click="onConfirm" type="primary" round class="start-evaluation-btn">
        开始评估
        </el-button>
    </div>
</template>
  
<script setup lang="ts">
  import { reactive, ref, defineEmits } from 'vue';
  import { ElMessage } from 'element-plus';
  import { useRoute, useRouter } from 'vue-router';
  
  // 定义 emits
  const emit = defineEmits(['addData']);
  const route = useRoute();
  const router = useRouter();

  interface ApiResponse<T = any> {
  code: number;             // 状态码
  message: string;          // 提示信息
  data?: T | null;          // 返回数据，可选，可能为 null 或具体类型
}
  
  // 定义数据项的类型
  interface DataItem {
    elasticityModulus: number | null;
    structuralAdhesiveStress: number | null;
    panelDamageArea: number | null;
    structuralAdhesiveDamageLength: number | null;
    connectorsNumber: number | null;
    backBoltsNumber: number | null;
    panelVerticality: number | null;
    stitchingWidth: number | null;
    panelSize: number | null;
    Offset_x: number | null;
    Offset_y: number | null;
    Offset_z: number | null;
    flatness: number | null;
    stains: number | null;
    cracks: number | null;
  }
  
  // 表单数据，初始化为 null
  const form = reactive<DataItem>({
    elasticityModulus: null,
    structuralAdhesiveStress: null,
    panelDamageArea: null,
    structuralAdhesiveDamageLength: null,
    connectorsNumber: null,
    backBoltsNumber: null,
    panelVerticality: null,
    stitchingWidth: null,
    panelSize: null,
    Offset_x: null,
    Offset_y: null,
    Offset_z: null,
    flatness: null,
    stains: null,
    cracks: null,
  });
  
  const dataList = ref<DataItem[]>([]); // 存储用户手动输入的所有数据
  
  
  const onInputNumber = (field: keyof DataItem, value: string) => {
    const trimmedValue = value.trim(); // 去除多余空格
    form[field] = trimmedValue === '' ? null : parseFloat(trimmedValue); // 转换为数字或设置为 null
  };
  
  // 验证表单数据
  const validateFormData = (): boolean => {
    for (const key in form) {
      const value = form[key as keyof DataItem];
      if (value === null || value === undefined || isNaN(value)) {
        ElMessage.error(`字段 "${getFieldLabel(key)}" 的值不能为空且必须是数字！`);
        return false;
      }
    }
    return true;
  };
  
  // 获取字段对应的中文标签
  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      elasticityModulus: 'elasticityModulus',
      structuralAdhesiveStress: 'structuralAdhesiveStress',
      panelDamageArea: 'panelDamageArea',
      structuralAdhesiveDamageLength: 'structuralAdhesiveDamageLength',
      connectorsNumber: 'connectorsNumber',
      backBoltsNumber: 'backBoltsNumber',
      panelVerticality: 'panelVerticality',
      stitchingWidth: 'stitchingWidth',
      panelSize: 'panelSize',
      Offset_x: 'Offset_x',
      Offset_y: 'Offset_y',
      Offset_z: 'Offset_z',
      flatness: 'flatness',
      stains: 'stains',
      cracks: 'cracks',
    };
    return labels[key] || key;
  };
  
  // 清空表单数据
  const clearForm = () => {
    Object.keys(form).forEach((key) => {
      form[key as keyof DataItem] = null;
    });
  };
  
  // 提交表单数据
  const onSubmit = () => {
    if (!validateFormData()) {
      return;
    }
    // 将表单数据推送到 dataList 中
    dataList.value.push({ ...form });  // 使用解构复制表单数据

    ElMessage.success('数据已添加！');
  
    // 清空表单并增加幕墙数量
    clearForm();
  };
  
  // 清空按钮事件
  const onCancel = () => {
    clearForm();
  };
// 确认按钮逻辑
const onConfirm = async () => {
  if (dataList.value.length < 2) {
    ElMessage.error("数据不足，至少需要添加 2 组数据！");
    return;
  }

  // 创建 FormData 对象，将手动输入的数据转为 JSON 字符串并上传
  const formData = new FormData();
  const jsonData = JSON.stringify(dataList.value); // 将数据列表转为 JSON 字符串
  formData.append("file", new Blob([jsonData], { type: "application/json" }), "data.json");

  const loading = ElLoading.service({
    lock: true,
    text: "正在上传与计算中",
    background: "rgba(0, 0, 0, 0.7)",
  });

  try {
    const { data, error } = await useFetch<ApiResponse<number>>("http://110.42.214.164:8005/data/", {
      method: "POST",
      body: formData,
    });

    loading.close();

    if (error.value) {
      console.error("接口错误:", error.value);
      ElMessage.error({
        message: `上传失败，请重试！错误信息：${error.value.message}`,
        type: "error",
      });
      return;
    }

    if (data.value?.code === 200) {
      ElMessage.success({
        message: "上传成功!",
        type: "success",
      });

      const batchID = data.value.data;
      if (batchID !== undefined) {
        router.push(`/calculating/${batchID}`); // 跳转到计算结果页面
      } else {
        console.error("返回的批次号为空");
        ElMessage.error("上传成功，但未收到批次号");
      }
    } else {
      ElMessage.error({
        message: `错误：${data.value?.message}（错误码：${data.value?.code}）`,
        type: "error",
      });
    }
  } catch (err) {
    loading.close();

    if (err instanceof Error) {
      ElMessage.error({
        message: `上传失败，请重试！错误信息：${err.message}`,
        type: "error",
      });
      console.error("请求异常:", err);
    } else {
      ElMessage.error({
        message: "上传失败，请重试！未知错误。",
        type: "error",
      });
      console.error("未知异常:", err);
    }
  }
};


</script>
  
<style scoped>
  .app-container {
    padding: 30px;
  }
  
  .title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #666;
  }
  
  .line {
    font-size: 14px;
    color: #666;
    margin-bottom: 20px;
  }
  
  .el-form {
    width: 25%;
    margin-left: 70px; /* 调整左侧距离 */
  }
  
  
  .el-form-item {
    margin-bottom: 20px;
  }

  .el-table-column {
    width: 130px;
}
  
  .el-button {
    margin-right: 10px;
  }
  /* 修改输入框标题的颜色和字体 */
    .el-form-item .el-form-item__label {
    color: #ffffff; /* 浅灰色 */
    font-family: 'Poppins', sans-serif; /* 选择好看的字体 */
    font-size: 14px;
    }
    .start-evaluation-btn {
  margin-top: 20px; /* 增加按钮与表格之间的空隙 */
}



</style>