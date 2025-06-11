<template>
<div class="box">
    <div style="width:35%;height: 100%;">
        <div class="box-title">
            <p>分割结果</p>
        </div>
        <div class="box-content">
            <el-image 
             :src="picked.image_path"
             :preview-src-list="[picked.image_path]" 
             style="width:80%;height: 60%;" 
             />
        </div>
    </div>
    <div style="width:65%;height: 100%;">
        <div class="box-title">
            <p>检测结果</p>
            <el-progress :percentage="(progress / nums * 100).toFixed(0)" style="width:50%;margin-left: auto;margin-right: auto;margin-top: 10px;" />
            <el-button type="primary" style="position: absolute;right: 10%;top:55%" @click="startCrackDetection" :loading="globalLoading">开始检测</el-button>
        </div>
        <el-scrollbar style="width:100%;height: 82%;">
        <div class="box-content" style="height: 100%;">
            <el-timeline style="width: 90%;height: 100%;">
                <el-timeline-item 
                    v-for="(item, index) in picked.segimages" 
                    :key="index"
                    :timestamp="`区域${index + 1}`"
                    placement="top"
                >
                    <el-card style="height: 20vh;">
                    <div class="result-card">
                        <div>
                            <div style="height: 5%;text-align: center;font-weight: bold">原始图片</div>
                            <div class="image-container">
                                <el-image
                                 :src="item.image_path" 
                                 :preview-src-list="[item.image_path]"
                                 style="width:80%;height: 80%;" 
                                 >
                                 </el-image>
                            </div>
                        </div>
                        <div>
                            <div style="height: 5%;text-align: center;font-weight: bold">Segformer模型</div>
                            <div class="image-container">
                                <el-image
                                 :src="item.crackimages[0]" 
                                 :preview-src-list="[item.crackimages[0]]"
                                 style="width:80%;height: 80%;" 
                                 >
                                 <template #error>
                                    <div class="image-slot">
                                        待检测
                                    </div>
                                  </template>
                                 </el-image>
                            </div>
                        </div>
                        <div>
                            <div style="height: 5%;text-align: center;font-weight: bold">CrackDetection模型</div>
                            <div class="image-container">
                                <el-image
                                 :src="item.crackimages[1]" 
                                 :preview-src-list="[item.crackimages[1]]"
                                 style="width:80%;height: 80%;" 
                                 >
                                 <template #error>
                                    <div class="image-slot">
                                        待检测
                                    </div>
                                  </template>
                                </el-image>
                            </div>
                        </div>
                    </div>
                    </el-card>
                </el-timeline-item>
            </el-timeline>
        </div>
        </el-scrollbar>
    </div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios'
import { useCrackDetectionStore } from '../store/CrackDetection'
const store = useCrackDetectionStore()

const picked = ref({
    image_path: "",
    segimages:[]
})

const nums = ref(0)
const progress = ref(6)
const globalLoading = ref(false)

const crackResult = ref(null)
const crackResult2 = ref(null)

const startCrackDetection = async () => {
  try {
    // 初始化结果数组
    crackResult.value = []
    crackResult2.value = []
    let allDetectionSuccess = true
    globalLoading.value = true

    // 对每个几何变换的图片进行检测
    for (let seg of picked.value.segimages) {

      try {
        const [response1, response2] = await Promise.all([
          axios.post('/crackdetection/segformer/predict', {
            url: seg.image_path
          }),
          axios.post('/crackdetection/crack-detection/detect', {
            url: seg.image_path
          })
        ])

        if (response1.data.success && response2.data.success) {
          // 添加第一个模型的检测结果
          crackResult.value.push({
            url: response1.data.data,
            have_crack: response1.data.have_crack
          })
          
          // 添加第二个模型的检测结果（只使用 mask_url）
          crackResult2.value.push({
            url: response2.data.data.mask_url
          })

            progress.value++;
            seg.crackimages.push(response1.data.data);
            seg.crackimages.push(response2.data.data.mask_url);

          // 上传两个模型的检测结果
          try {
            // 上传第一个模型的检测结果
            await axios.post('/crackdetection/addCrackImage', {
              seg_id: seg.segId,
              image_path: response1.data.data
            })
            
            // 上传第二个模型的检测结果
            await axios.post('/crackdetection/addCrackImage', {
              seg_id: seg.segId,
              image_path: response2.data.data.mask_url
            })
          } catch (error) {
            console.error('Error uploading crack detection results:', error)
          }
        } else {
          throw new Error(`裂缝检测失败: ${url}`)
        }
      } catch (error) {
        allDetectionSuccess = false
        console.error('Detection failed:', error)
      }
    }

    // 所有检测完成后，更新状态
    if (allDetectionSuccess && crackResult.value.length > 0) {
      // 检查是否有裂缝
      const hasCrack = crackResult.value.some(result => result.have_crack)
      try {
        // 上传检测状态
        await axios.post('/crackdetection/update_image', {
          image_id: store.pickedImage.image_id,
          have_crack: hasCrack ? "1" : "0",
          status: "processed"
        })
      } catch (error) {
        console.error('Error updating image status:', error)
      }
    }
  } catch (error) {
    ElMessage.error('检测失败：' + error.message)
  } finally {
    globalLoading.value = false
  }
}

onMounted(() => {
  const projectId = store.projectId
  if (!projectId) {
    ElMessage.error('项目ID不存在')
    return
  }

    console.log('debug', store.pickedImage);
    picked.value = store.pickedImage;
    nums.value = picked.value.segimages.length;
})
</script>

<style scoped>
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 15px;
}

.box{
  background-color: white;
  display: flex;
  width: 96%;
  max-width: 96%;
  height: 90%;
  max-height: 90%;
  margin-top: 4%;
  border-color: #171D25;
  border-radius: 5px;
  box-shadow: 0px 0px 10px rgb(81, 81, 81);
}

.box-title{
    height: 15%;
    text-align: center;
    color: black;
    font-size: 20px;
    padding-top: 20px;
    position: relative;
}

.box-content{
    width: 100%;
    height: 85%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.result-card{
    width:100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 三列布局 */
}

:deep(.el-card__body) {
  padding-right: 0;
  padding-left: 0;
  padding-top: 3%;
  padding-bottom: 0;
  height: 100%;
}

.image-container{
    width: 100%;
    height: 95%;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.el-timeline-item__node) {
  background-color: #07C160; /* 节点颜色 */
}
</style>