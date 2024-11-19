<template>
    <div class="main-container">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 5px; margin-right: 5px">
        <el-button @click="GoToDash">进入仪表盘</el-button>
        <el-button type="primary" @click="backToMain">返回主页</el-button>
      </div>
  
      <div class="upload-container">
        <el-upload
          class="upload-demo"
          :action="'http://localhost:5000/defect/upload'"
          drag
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
        >
          <el-icon class="el-icon--upload">
            <upload-filled />
          </el-icon>
          <div class="el-upload__text">拖动文件至区域内或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">jpg/png files with a size less than 50MB</div>
          </template>
        </el-upload>
      </div>
  
      <el-row :gutter="10">
        <el-col :span="3">
          <el-button type="primary" @click="startDetection">
            开始检测
            <el-icon class="el-icon--right">
              <Upload />
            </el-icon>
          </el-button>
        </el-col>
        <el-col :span="21">
          <el-progress :percentage="progressPercentage" status="success" />
        </el-col>
      </el-row>

      <el-scrollbar class="scrollbar-container">
        <div v-if="ImgResult">
          检测结果：{{ ImgResult }} <!-- 显示检测结果 -->
        </div>
        <div v-if="processedImageUrl" class="image-preview">
          <h3>处理后的图片：</h3>
          <img :src="processedImageUrl" alt="Processed Image" class="preview-img" />
        </div>
      </el-scrollbar>
      
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { UploadFilled } from '@element-plus/icons-vue';
  import { Upload } from '@element-plus/icons-vue';
  import axios from 'axios';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  const imageUrl = ref(''); // 存储上传后的图片路径
  const progressPercentage = ref(0); // 进度条响应变量
  const uploadedFile = ref(null); // 存储上传的文件
  const ImgResult = ref(null); 
  const fileList = ref([]); // 存储上传的文件列表
  const imagePreviewUrl = ref(null); // 存储图片预览的 URL
  const processedImageUrl = ref(null); // Store the processed image URL (newly added)
  
  const backToMain = () => {
    router.push('/');
  };
  
  const GoToDash = () => {
    router.push({
      name: 'layout',
      params: {
        choice: 'dashboard',
      },
    });
  };
  
  const handleUploadSuccess = (response, file, fileList) => {
    console.log('上传成功：', response);
    imageUrl.value = response.url; // 假设后端返回的图片 URL 在 response.url 中
    uploadedFile.value = file.raw; // 存储上传的文件
    imagePreviewUrl.value = URL.createObjectURL(file.raw); // 创建图片预览的 URL
  };
  
  const handleUploadError = (error) => {
    console.error('上传失败：', error);
  };
  
  const handlePreview = (file) => {
    // 处理图片预览
    imagePreviewUrl.value = URL.createObjectURL(file.raw);
  };

  const startDetection = () => {
    if (!uploadedFile.value) {
        console.error('请先上传图片');
        return;
    }

    let formData = new FormData();
    formData.append('image', uploadedFile.value);
    console.log("发送的图片路径：", imageUrl.value);

    axios
        .post('http://localhost:5000/defect/classify', formData)
        .then((response) => {
        console.log('检测结果：', response.data);
        ImgResult.value = response.data.result; // 只提取结果部分

        if (ImgResult.value === 'defect') {
            // 如果检测到 defect，调用 process_image 后端 API
            axios
            .post('http://localhost:5000/defect/showDefect', {
                image_path: imageUrl.value.replace('http://localhost:5000/', ''),
            })
            .then((processResponse) => {
                processedImageUrl.value = `http://localhost:5000/${processResponse.data.processed_image_path}`;
                console.log("处理后的图片路径：", processedImageUrl.value); // 在这里记录路径，确保请求完成后
            })
            .catch((error) => {
                console.error('处理图片失败：', error);
            });
        } else {
            // 如果检测到 undefect，直接显示原图
            processedImageUrl.value = imagePreviewUrl.value;
            console.log("处理后的图片路径：", processedImageUrl.value); // 在这里记录路径，确保请求完成后
        }
        // 模拟进度增长
        if (progressPercentage.value === 100) return;
        const intervalId = setInterval(() => {
            progressPercentage.value += 1;
            if (progressPercentage.value === 100) clearInterval(intervalId);
        }, 2);
        })
        .catch((error) => {
        console.error('检测失败：', error);
        });
};

  </script>
  
  <style scoped>
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
  </style>
  