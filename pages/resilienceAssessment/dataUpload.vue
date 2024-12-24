<script setup lang="ts">
import type { UploadInstance,UploadProps, UploadUserFile} from 'element-plus';
import { defineComponent, ref } from "vue";
import {UploadFilled} from "@element-plus/icons-vue";
import type { UploadRequestOptions } from "element-plus";
import { useFetch } from '#app';

const upload = ref<UploadInstance>()
const fileList = ref<UploadUserFile[]>([])

// 为 newData 参数显式指定类型 DataItem

const router = useRouter();  // 获取路由实例

// 当前文件顶部定义
interface ApiResponse<T = any> {
  code: number;             // 状态码
  message: string;          // 提示信息
  data?: T | null;          // 返回数据，可选，可能为 null 或具体类型
}


const exceedHandler: UploadProps["onExceed"] = (files, fileList) => {
  ElMessage.warning("一次只能上传一个文件！");
};

const submitConfirm = () => {
  console.log('submitUpload')
  upload.value!.submit()
}

// 上传前的文件格式检查
const beforeDataUpload: UploadProps["beforeUpload"] = (rawFile) => {
  const allowedTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]; // .xls 和 .xlsx 的 MIME 类型
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error("文件必须为 .xls 或 .xlsx 格式！");
    return false;
  }
  return true;
};

// 自定义上传
const fileUpload = async (options: UploadRequestOptions) => {
  const { file } = options; // 从参数中提取文件
  const formData = new FormData();
  formData.append("file", file); // 键名必须与后端一致

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
        router.push(`/calculating/${batchID}`);
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

<template>
  <div id="contentContainer" class="flex-content-around h-full">
    <div id="upLoaderContainer" class="flex-col" style="margin: auto; padding: 0 500px">
      <el-upload
          ref="upload"
          class="avatar-uploader"
          drag
          accept=".xlsx,.xls"
          action="/data/"
          v-model:file-list="fileList"
          :show-file-list="true"
          :on-exceed="exceedHandler"
          :auto-upload="false"
          :before-upload="beforeDataUpload"
          :http-request="fileUpload"
          :limit="1"
      >
        <template #trigger>
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">拖动文件至区域内或<em>点击上传</em></div>
        </template>
        <template #tip>
          <div class="el-upload__tip">
            仅支持.xls或.xlsx文件
          </div>
        </template>
      </el-upload>
      <div id="tip" class="bg-blend-color-dodge" style="margin: 20px 0px">
        <el-card style="width: 100%" shadow="hover">
          <el-text class="mx-1" size="large">文件注意事项：<br/><br/></el-text>
          1. 首行必须为各个属性的属性名，可以复制粘贴下面的内容<br/>
          <el-card style="margin: 5px; background: rgba(207,212,213,0.63)" shadow="always">
            elasticityModulus structuralAdhesiveStress panelDamageArea structuralAdhesiveDamageLength connectorsNumber backBoltsNumber panelVerticality stitchingWidth panelSize Offset_x Offset_y Offset_z flatness stains cracks
          </el-card>
          2. 第二行开始每一行为一块幕墙的数据<br/>
          3. 每一行的数字对应首行的属性<br/>
          4. 数字可以是正数、小数和负数<br/>
          5. 文件中幕墙数据至少有两行，否则无法进行评价
        </el-card>
      </div>
       <div class="flex" style="display: flex; gap: 10px;">
        
        <el-button type="primary" round @click="submitConfirm">
          开始评估
        </el-button>
        <div style="height: 20px;"></div>
        <NuxtLink to="/resilienceAssessment/manualInputPage">
          <el-button type="default" round>手动输入数据</el-button>
        </NuxtLink>

      </div>
    </div>
  </div>
</template>
  
<style scoped>
#contentContainer {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  height: 100vh; /* 确保父容器有足够的高度 */
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 48px;
  color: #8c939d;
  width: 378px;
  height: 378px;
  text-align: center;
}
.input-button {
  color: #409eff;
}
</style>
  
  