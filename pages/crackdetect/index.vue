<template>
  <div class="container">
    <p class="title">石材裂缝检测</p>
    
    <div v-if="store.currentStep">
      <el-button  type="primary" class="button" :disabled="(store.pickedImage===null || !store.pickedImage.detected) && store.currentStep===2" @click="store.nextStep">
          <p v-if="store.currentStep<3">下一步</p>
          <p v-else>生成报告</p>
      </el-button>
    </div>
    <div class="box">
      <div class="side">
      <div class="steps">
        <el-steps direction="vertical" :active="store.currentStep">
          <el-step
            v-for="(step, index) in steps"
            :key="index"
            :title="step.title"
            :description="step.description"
          >
          <template #icon>
            <i :class="getStepIcon(index)"></i>
          </template>
        </el-step>
        </el-steps>
        </div>
        <div style="width:100%;display: flex;justify-content: center;align-items: center;">
        <el-button  type="primary" class="bottom_button" @click="store.preStep">
          返回上一步
        </el-button>
        </div>
      </div>
      <div class="content">
        <component
         :is="currentComponent" 
         />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import './asset/icon/iconfont.css'
import pickProject from './steps/pickProject.vue'
import uploadPicture from './steps/uploadPicture.vue'
import Segmentation from './steps/Segmentation.vue'
import CrackDetection from './steps/crackDetection.vue'

import { useCrackDetectionStore } from './store/CrackDetection'
const store = useCrackDetectionStore()

const steps = ref([
  { title: '选择项目',component: 'pickProject' },
  { title: '上传图片',component: 'uploadPicture' },
  { title: '幕墙块分割',component: 'Segmentation'},
  { title: '裂缝检测',component: 'CrackDetection'}
]);


// 组件映射
const components = {
  pickProject,
  uploadPicture,
  Segmentation,
  CrackDetection
};

// 当前显示的组件
const currentComponent = computed(() => {
  return components[steps.value[store.currentStep].component]
})

const getStepIcon = (index) => {
  const baseClass = 'iconfont '; // iconfont 基础类名
  
  if (index < store.currentStep) {
    return baseClass + 'icon-circle-check-filled'; // 已完成 - 对号圆
  } else if (index === store.currentStep) {
    return baseClass + 'icon-circle'; // 当前步骤 - 实心圆
  } else {
    return baseClass + 'icon-circle1'; // 未完成 - 空心圆
  }
};
</script>

<style scoped>
.container {
  position: relative;
  height: 100vh;
  padding-top: 3vh;
  padding-bottom: 5vh;
  padding-left: 2vw;
  padding-right: 2vw;
  background-color: #F5F7FA;
}

.button{
  position: absolute;
  right: 2vw;
  top: 5vh;
  width: 7vw;
  height: 4vh;
}

.bottom_button{
  width: 5vw;
  height: 4vh;
}

.title{
  color: black;
  font-size: 50px;
  font-weight: bold;
  margin-bottom: 2vh;
}

.box{
  background-color: white;
  display: flex;
  align-items: center;
  width: 100%;
  height: 85%;
  border-color: black;
  border-radius: 5px;
  box-shadow: 0px 0px 10px rgb(81, 81, 81);
}

.side{
  width: 14%;
  height: 100%;
}

.steps{
  height: 85%;
  margin-top: 25%;
  width: 100%;
  display: flex;
  justify-content: center;
}

.content{
  margin-left: 3%;
  height: 90%;
  width: 82%;
}

::v-deep .is-vertical .el-step__head {
  order: 2;
  margin-left: 5px;
}

::v-deep .is-vertical .el-step__main {
  order: 1;
  text-align: right;
  margin-bottom: 10px;
}

::v-deep .el-step.is-vertical .el-step__main {
  margin-left: 0;
}

::v-deep .el-step.is-vertical:not(:last-child) .el-step__line {
  top: 40px; /* 调整线条开始位置 */
  bottom: 30px; /* 调整线条结束位置 */
  left: -45px; /* 调整线条水平位置 */
  height: calc(100% - 60px); /* 减少线条长度 */
}

:deep(.el-step__title) {
  font-size: 18px;
}

:deep(.el-step__head.is-process) {
  color: #409EFF; /* 修改icon颜色 */
}

:deep(.el-step__title.is-finish) {
  color: black;
}
</style>