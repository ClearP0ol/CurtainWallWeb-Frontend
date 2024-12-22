<template>
  <div class="main-container">
    <div style="display: flex; justify-content: flex-end; margin-bottom: 5px; margin-right: 5px">
      <el-button class="custom-button" type="primary" @click="backToMain">返回主页</el-button>
    </div>
    <div class="upload-container">
      <el-upload
          class="upload-demo"
          accept="image/*"
          :show-file-list="true"
          :before-upload="beforeUpload"
          @change="handleChange"
          drag
          action="http://111.231.168.12:8090/upload"
      >
        <el-icon class="el-icon--upload">
          <upload-filled />
        </el-icon>
        <div class="el-upload__text">点击区域
          <em type="primary">上传图片</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">jpg/png files with a size less than 10MB</div>
        </template>
      </el-upload>
    </div>
    <el-row :gutter="10">
      <el-col :span="3">
        <el-button class="custom-button" type="success" @click="startDetection" :disabled="!imageFile">
          开始检测
        </el-button>
      </el-col>
    </el-row>

    <!-- 将结果图片放在一个带滚动条的灰色框中 -->
    <div v-if="resultImageUrl" class="result-image-container">
      <h3>检测结果:</h3>
      <div class="image-box">
        <img :src="resultImageUrl" alt="检测结果图" class="result-image" />
      </div>
      <el-button class="custom-button" type="danger" @click="closeModal">关闭</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import axios from 'axios';
import type { UploadFile } from 'element-plus';
import { Upload, UploadFilled } from "@element-plus/icons-vue";
import { useRouter } from "#vue-router";

export default defineComponent({
  components: { Upload, UploadFilled },
  setup() {
    const router = useRouter();
    const backToMain = () => {
      router.push("/");
    };

    const imageFile = ref<File | null>(null);
    const resultImageUrl = ref<string>('');

    const beforeUpload = (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        alert('请上传图片文件!');
      }
      return isImage;
    };

    const handleChange = (uploadFile: UploadFile, uploadFiles: UploadFile[]) => {
      if (uploadFiles.length > 0 && uploadFiles[0].raw) {
        imageFile.value = uploadFiles[0].raw;
      } else {
        imageFile.value = null;
      }
    };

    const startDetection = async () => {
      if (!imageFile.value) return;

      const formData = new FormData();
      formData.append('file', imageFile.value);
      formData.append('filename', imageFile.value.name);

      try {
        const response = await axios.post('http://110.42.214.164:8000/detect', formData, {
          headers: {
            'Content-Type': 'multipart/form-data' // 保持 Content-Type 为 multipart/form-data
          },
          responseType: 'blob'
        });

        if (response.status === 200) {
          const blob = new Blob([response.data], { type: 'image/jpeg' });
          const imageUrl = URL.createObjectURL(blob);
          resultImageUrl.value = imageUrl; // 直接使用生成的 URL
        }
      } catch (error) {
        console.error('上传失败:', error);
        alert('上传失败，请重试');
      }
    };

    const closeModal = () => {
      resultImageUrl.value = ''; // 清空图片
    };

    return {
      imageFile,
      resultImageUrl,
      beforeUpload,
      handleChange,
      startDetection,
      closeModal,
      backToMain,
    };
  },
});
</script>

<style scoped>
.primary {
  background: #409eff;
}
.upload-demo {
  margin-bottom: 20px;
}
.main-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 10px;
}

.upload-container {
  padding: 20px;
  background: #f5f7fa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  text-align: center;
  margin-bottom: 20px;
}

.upload-demo .el-icon--upload {
  font-size: 50px;
  color: #8c939d;
}

.upload-demo .el-upload__text {
  margin-top: 10px;
  font-size: 16px;
  color: #606266;
}

.upload-demo .el-upload__tip {
  font-size: 12px;
  color: #909399;
}

.result-image-container {
  margin-top: 20px; /* 添加上边距 */
  text-align: center; /* 中心对齐 */
}

.image-box {
  width: 100%; /* 宽度占满父容器 */
  height: 300px; /* 设置固定高度 */
  overflow-y: auto; /* 允许垂直滚动 */
  background-color: #f5f7fa; /* 灰色背景 */
  border: 1px solid #ccc; /* 边框样式 */
  display: flex; /* 使用 flexbox 来居中内容 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  padding: 10px; /* 添加内边距，留出上下灰色区域 */
}

.result-image {
  width: 80%; /* 图片宽度占容器的80% */
  max-height: 100%; /* 限制图片的最大高度 */
  height: auto; /* 自适应高度 */
  object-fit: contain; /* 保持比例 */
}

.custom-button {
  background-color: #409eff; /* 设置初始背景颜色 */
  border-color: #409eff;
  color: #fff; /* 设置文本颜色 */
}
.custom-button:hover {
  background-color: #a0cfff; /* 悬停时的背景颜色 */
  border-color: #a0cfff;
}
.custom-button:disabled {
  background-color: #a0cfff; /* 禁用时的背景颜色 */
  border-color: #a0cfff;
  color: #fff; /* 禁用时的文本颜色 */
}
</style>
