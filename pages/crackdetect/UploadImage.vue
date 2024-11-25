<template>
    <div class="container">
      <!-- 步骤导航 -->
      <el-steps
        class="stepsStyle"
        :active="0"
        finish-status="success"
        simple
      >
        <el-step title="上传图片" style="cursor: pointer" />
        <el-step title="幕墙块目标检测" style="cursor: pointer" />
        <el-step title="幕墙块分割" style="cursor: pointer" />
        <el-step title="裂缝检测" style="cursor: pointer" />
        <el-step title="裂缝测量" style="cursor: pointer" />
      </el-steps>
  
      <!-- 内容区域 -->
      <div class="content">
        <el-row :gutter="20">
          <el-col :span="18">
            <el-card
              style="background-color: #fffdfa; padding: 10px;"
            >
              <el-scrollbar class="image-scroll">
                <div v-for="(url, index) in urls" :key="url" class="image-row">
                  <el-image :src="url" fit="fill" />
                </div>
              </el-scrollbar>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card
              style="background-color: #fffdfa; padding: 10px;"
            >
              <el-upload
                class="upload-demo"
                drag
                multiple
                :show-file-list="false"
              >
                <el-image src="upload.jpg"></el-image>
                <div class="el-upload__text">
                  将文件拖到此处或 <em style="color: #b29f82">点击上传</em>
                </div>
              </el-upload>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  
  const urls = ref([
    "image1.jpg",
    "image2.jpg",
    "image3.jpg",
    "image4.jpg",
    "image5.jpg",
  ]);
  </script>
  
  <style scoped>
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #dbd4cc;
    padding: 20px;
  }
  
  .stepsStyle {
    margin-bottom: 20px;
  }
  
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .image-scroll {
    max-height: 600px;
    overflow-y: auto;
  }
  
  .image-row {
    margin-bottom: 10px;
  }
  
  .upload-demo {
    text-align: center;
  }
  </style>
  