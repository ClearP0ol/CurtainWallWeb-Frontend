<template>
  <div class="upload-section">
    <div class="small-title">上传图片</div>
    <div class="upload-content">
      <el-button
        v-if="
          (uploadedImages.length || ossImages.length) && mainTab === 'local'
        "
        type="primary"
        plain
        class="upload-button"
        @click="startDetection"
      >
        确认上传 ({{ uploadedImages.length + ossImages.length }})
      </el-button>

      <!-- 主 Tab: 本地上传 vs OSS 上传 -->
      <el-tabs v-model="mainTab" class="main-tabs">
        <!-- Tab 1: 本地上传 -->
        <el-tab-pane label="本地上传" name="local">
          <el-upload
            class="upload"
            drag
            multiple
            :before-upload="handleBeforeUpload"
            :http-request="customUpload"
            :before-remove="handleRemove"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将图片拖到此处或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip" style="text-align: center">
                jpg/png files with a size less than 1024kb
              </div>
            </template>
          </el-upload>
        </el-tab-pane>

        <!-- Tab 2: 从 OSS 添加 -->
        <el-tab-pane label="从 OSS 添加" name="oss">
          <el-tabs v-model="ossTab" class="oss-tabs">
            <!-- 批量输入 URL -->
            <el-tab-pane label="批量输入链接" name="url">
              <el-input
                v-model="ossUrlList"
                type="textarea"
                :rows="5"
                placeholder="每行一个图片链接，例如：&#10;http://8.159.143.133:9000/oss/download/crack-detection/examples/example1.jpg&#10;http://8.159.143.133:9000/oss/download/crack-detection/examples/example2.jpg"
                class="oss-textarea"
              />
              <div
                style="
                  margin-top: 10px;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                "
              >
                <span style="color: #909399; font-size: 13px">
                  已识别 {{ ossUrlCount }} 个有效链接
                </span>
                <el-button
                  type="primary"
                  @click="addOssUrls"
                  :disabled="ossUrlCount === 0"
                >
                  添加到列表
                </el-button>
              </div>
            </el-tab-pane>

            <!-- 示例图片库 -->
            <el-tab-pane label="示例图片库" name="examples">
              <div class="examples-grid">
                <div
                  v-for="img in exampleImages"
                  :key="img.id"
                  class="example-item"
                >
                  <el-card :body-style="{ padding: '12px' }" shadow="hover">
                    <el-image
                      :src="img.url"
                      fit="cover"
                      class="example-image"
                      lazy
                    >
                      <template #error>
                        <div class="image-error">
                          <el-icon><Picture /></el-icon>
                        </div>
                      </template>
                    </el-image>
                    <div class="example-footer">
                      <el-checkbox
                        :label="img.url"
                        :value="img.url"
                        v-model="selectedExamples"
                      >
                        <span class="example-filename" :title="img.filename">{{
                          img.filename
                        }}</span>
                      </el-checkbox>
                    </div>
                  </el-card>
                </div>
              </div>
              <div class="examples-actions">
                <el-button
                  type="primary"
                  @click="addSelectedExamples"
                  :disabled="selectedExamples.length === 0"
                >
                  添加选中的 {{ selectedExamples.length }} 张
                </el-button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
  <div style="height: 50%; display: flex">
    <div class="small-title">已上传图片</div>
    <div style="width: 65%; display: flex; justify-content: center">
      <el-carousel
        trigger="click"
        :autoplay="false"
        arrow="always"
        height="90%"
        class="pics"
      >
        <el-carousel-item
          v-for="(item, index) in carouselImages"
          :key="index"
          class="image-slide"
        >
          <div class="pic-name">
            <span class="filename-text" :title="item.name">{{
              item.name
            }}</span>
            <el-tag
              v-if="item.detected"
              type="success"
              effect="dark"
              round
              class="item"
              >已处理</el-tag
            >
            <el-tag v-else type="warning" effect="dark" round class="item"
              >未处理</el-tag
            >
          </div>
          <el-image
            :src="item.src"
            fit="contain"
            :preview-src-list="[item.src]"
            :initial-index="index"
            :preview-teleported="true"
            lazy
            class="carousel-image"
          />
        </el-carousel-item>
      </el-carousel>
    </div>
  </div>
</template>

<script setup>
import { UploadFilled, Picture } from "@element-plus/icons-vue";
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { useCrackDetectionStore } from "../store/CrackDetection";
import { useExampleImages } from "~/composables/useExampleImages";

const store = useCrackDetectionStore();
const { examples: exampleImages } = useExampleImages();

// 内置的用户名和密码
const credentials = {
  userName: "crack-detection",
  password: "tongji-icw-7384",
};

// OSS 图片相关
const mainTab = ref("local"); // 主 Tab: local 或 oss
const ossTab = ref("url"); // OSS 子 Tab: url 或 examples
const ossUrlList = ref("");
const selectedExamples = ref([]);
const ossImages = ref([]); // 存储从 OSS 添加的图片

// 计算有效 URL 数量
const ossUrlCount = computed(() => {
  return ossUrlList.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("http://") || line.startsWith("https://"))
    .length;
});

// 添加 OSS URL 到待上传列表
const addOssUrls = () => {
  const urls = ossUrlList.value
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) => line.startsWith("http://") || line.startsWith("https://"),
    );

  if (urls.length === 0) {
    ElMessage.warning("请输入有效的图片链接");
    return;
  }

  // 验证 URL 格式和图片扩展名
  const validUrls = [];
  const invalidUrls = [];

  urls.forEach((url) => {
    try {
      new URL(url);
      // 检查是否是图片
      if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/i)) {
        validUrls.push(url);
      } else {
        invalidUrls.push(url);
      }
    } catch {
      invalidUrls.push(url);
    }
  });

  if (invalidUrls.length > 0) {
    ElMessage.warning(`跳过 ${invalidUrls.length} 个无效链接`);
  }

  if (validUrls.length === 0) {
    ElMessage.error("没有有效的图片链接");
    return;
  }

  // 添加到 OSS 图片列表
  validUrls.forEach((url) => {
    const filename =
      url.split("/").pop()?.split("?")[0] || `image-${Date.now()}`;
    ossImages.value.push({
      name: filename,
      url: url,
      fromOss: true,
    });
  });

  ElMessage.success(`已添加 ${validUrls.length} 张图片到列表`);
  ossUrlList.value = ""; // 清空输入框
};

// 添加选中的示例图片
const addSelectedExamples = () => {
  selectedExamples.value.forEach((url) => {
    const img = exampleImages.find((e) => e.url === url);
    if (img) {
      ossImages.value.push({
        name: img.filename,
        url: url,
        fromOss: true,
      });
    }
  });

  ElMessage.success(`已添加 ${selectedExamples.value.length} 张示例图片`);
  selectedExamples.value = [];
};

const sanitizeOssFilename = (originalName) => {
  const dotIndex = originalName.lastIndexOf(".");
  const hasExt = dotIndex > 0 && dotIndex < originalName.length - 1;
  const base = hasExt ? originalName.slice(0, dotIndex) : originalName;
  const ext = hasExt ? originalName.slice(dotIndex) : "";

  const safeBase = base
    .replace(/[^A-Za-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const safeExt = ext.replace(/[^A-Za-z0-9.]/g, "");
  const fallback = `image-${Date.now()}`;

  return `${safeBase || fallback}${safeExt}`;
};

// 图片数据
const carouselImages = ref([]);

const handleBeforeUpload = (file) => {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    ElMessage.error("只能上传图片文件！");
    return false;
  }
  return true;
};

const handleRemove = (file, fileList) => {
  // 从 uploadedImages 中移除
  uploadedImages.value = uploadedImages.value.filter(
    (img) => img.name !== file.name,
  );

  // 从 pendingFiles 中移除（可以用 name 或其他属性判断）
  pendingFiles.value = pendingFiles.value.filter((f) => f.name !== file.name);

  // 如果你要阻止删除，返回 false；否则返回 true
  return true;
};

const uploadedImages = ref([]);
const pendingFiles = ref([]);
const uploadProgress = ref(0);

const customUpload = async (options) => {
  const { file } = options;
  const localUrl = URL.createObjectURL(file);
  pendingFiles.value.push(file);
  uploadedImages.value.unshift({
    name: file.name,
    url: localUrl,
    status: "pending",
  });

  ElMessage.success("图片已添加，请点击按钮确认上传");
};

const startDetection = async () => {
  if (pendingFiles.value.length === 0 && ossImages.value.length === 0) {
    ElMessage.warning("请先添加图片");
    return;
  }

  if (!store.projectId) {
    ElMessage.error("项目ID不存在，请重新创建项目");
    store.preStep();
    return;
  }

  try {
    ElMessage.info("正在处理图片...");

    // 处理本地上传的文件
    for (let i = 0; i < pendingFiles.value.length; i++) {
      const file = pendingFiles.value[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userName", credentials.userName);
      formData.append("password", credentials.password);

      const safeFilename = sanitizeOssFilename(file.name);
      const targetPath = `crackdetect/${safeFilename}`;
      const encodedTargetPath = targetPath
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");

      uploadProgress.value = 0;
      const response = await axios.post(
        `/oss/oss/upload/${encodedTargetPath}`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            uploadProgress.value = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
          },
        },
      );

      if (response.data) {
        // 调用upload_image_url接口
        try {
          const imageResponse = await axios.post(
            "/crackdetection/upload_image_url",
            {
              project_id: store.projectId,
              image_path: response.data,
            },
          );

          if (imageResponse.data.error) {
            ElMessage.error(imageResponse.data.error);
            continue;
          }

          carouselImages.value.push({
            detected: false,
            src: response.data,
            name: response.data.split("/").pop(),
            image_id: imageResponse.data.image_id,
          });
        } catch (error) {
          ElMessage.error("保存图片记录失败：" + error.message);
          continue;
        }
      }
    }

    // 处理从 OSS 添加的图片（直接使用 URL）
    for (let i = 0; i < ossImages.value.length; i++) {
      const ossImg = ossImages.value[i];
      try {
        const imageResponse = await axios.post(
          "/crackdetection/upload_image_url",
          {
            project_id: store.projectId,
            image_path: ossImg.url,
          },
        );

        if (imageResponse.data.error) {
          ElMessage.error(`${ossImg.name}: ${imageResponse.data.error}`);
          continue;
        }

        carouselImages.value.push({
          detected: false,
          src: ossImg.url,
          name: ossImg.name,
          image_id: imageResponse.data.image_id,
        });
      } catch (error) {
        ElMessage.error(`${ossImg.name} 保存失败：${error.message}`);
        continue;
      }
    }

    const totalCount = pendingFiles.value.length + ossImages.value.length;
    ElMessage.success(`成功添加 ${totalCount} 张图片！`);
    pendingFiles.value = [];
    uploadedImages.value = [];
    ossImages.value = [];
  } catch (error) {
    console.error("处理失败:", error);
    ElMessage.error(
      `处理失败: ${error.response?.data?.message || error.message}`,
    );
  } finally {
    uploadProgress.value = 0;
  }
};

const fetchPendingImages = async (projectId) => {
  try {
    const response = await axios.get(
      `/crackdetection/getProjectHierarchy/${projectId}`,
    );

    // 如果返回的是数组，说明有待处理的图片
    if (Array.isArray(response.data.images)) {
      const mappedImages = response.data.images.map((img) => {
        const overview = img.segoverviews?.find((o) => o.segimages.length > 0);
        return {
          detected: img.status == "processed" || overview?.segimages.length > 0,
          src: img.image_path,
          name: img.image_path.split("/").pop(), // 从路径中提取文件名
          image_id: img.image_id,
        };
      });
      // 按 image_id 去重，避免重复渲染导致页面变慢
      carouselImages.value = Array.from(
        new Map(mappedImages.map((item) => [item.image_id, item])).values(),
      );
    }
    // 如果返回消息是没有待处理图片，则跳转到历史记录页面
    else if (response.data.message === "No pending images found") {
      ElMessage.success(
        "所有图片已处理完成，请前往历史记录页面查看记录并打印报告",
      );
      store.preStep();
      return;
    }
    // 其他情况可能是错误
    else {
      console.log("获取图片列表失败:", response.data.images);
      throw new Error("获取图片列表失败");
    }
  } catch (error) {
    console.error("Failed to fetch pending images:", error);
    ElMessage.error("获取待处理图片失败：" + error.message);
  }
};

onMounted(() => {
  const projectId = store.projectId;
  if (!projectId) {
    ElMessage.error("项目ID不存在");
    router.push("/crackdetect/history");
    return;
  }

  fetchPendingImages(projectId);
});
</script>

<style scoped>
/* 布局优化 */
.upload-section {
  height: 50%;
  display: flex;
  gap: 2vw;
}

.upload-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 主 Tab 样式 */
.main-tabs {
  height: 100%;
}

.main-tabs :deep(.el-tabs__content) {
  height: calc(100% - 40px);
  overflow-y: auto;
}

.main-tabs :deep(.el-tab-pane) {
  height: 100%;
}

:deep(.el-upload-list) {
  position: absolute;
  right: -10vw;
  width: 15vw;
  top: 10%;
  z-index: 999;
}

.upload-button {
  position: absolute;
  top: -1vh;
  right: -5vw;
  min-width: 120px;
  white-space: nowrap;
  z-index: 10;
}

.small-title {
  font-size: 28px;
  font-weight: bold;
  color: black;
  width: 16%;
  margin-right: 2vw;
  word-break: break-word;
}

.upload {
  width: 60%;
  margin-top: 4%;
  margin-left: 3vw;
}

:deep(.el-upload-dragger) {
  border-color: #93c8fc;
  border-width: 2px;
  border-style: dashed;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
}

.pics {
  width: 100%;
  background-color: #d6d6d6;
  margin-top: 3vh;
  position: relative;
  overflow: hidden;
  min-width: 0;
}

.pic-name {
  color: black;
  position: static;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 8px;
  box-sizing: border-box;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.filename-text {
  display: block;
  max-width: 72%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item {
  margin-left: 5%;
}

.carousel-image {
  display: block;
  width: 100%;
  height: calc(100% - 40px);
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  margin-top: 0;
  object-fit: contain;
  overflow: hidden;
}

.image-slide {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.pics :deep(.el-carousel__indicator--outside button) {
  background-color: #c0c4cc;
}

.pics :deep(.el-carousel__indicator--outside.is-active button) {
  background-color: white;
}

/* 自定义箭头样式 */
.pics :deep(.el-carousel__arrow) {
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 20px;
}

.pics :deep(.el-carousel__arrow:hover) {
  background-color: rgba(0, 0, 0, 0.5);
}

.carousel-image :deep(.el-image__inner) {
  object-fit: contain;
}

.carousel-image :deep(.el-image__wrapper) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

@media (max-width: 1366px) {
  .upload {
    width: 72%;
    margin-left: 0;
  }

  .small-title {
    width: 22%;
    font-size: 22px;
  }

  .upload-button {
    right: -2vw;
  }
}

@media (max-width: 1100px) {
  :deep(.el-upload-list) {
    position: static;
    width: 100%;
    margin-top: 8px;
  }

  .upload {
    width: 100%;
    margin: 0;
  }

  .small-title {
    width: 24%;
    font-size: 18px;
    margin-right: 10px;
  }

  .upload-button {
    top: -42px;
    right: 0;
  }

  .carousel-image {
    width: 82%;
  }

  .filename-text {
    max-width: 62%;
  }
}

/* OSS 输入相关样式 */
.oss-input-section {
  flex-shrink: 0;
  width: 100%;
}

.oss-tabs {
  background: transparent;
}

.oss-textarea {
  font-size: 12px;
}

/* 示例图片网格 - 无滚动容器 */
.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 10px 0;
}

.example-item {
  display: flex;
}

.example-item :deep(.el-card) {
  width: 100%;
  cursor: pointer;
  transition: all 0.3s;
}

.example-item :deep(.el-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 图片预览 - 增大尺寸 */
.example-image {
  width: 100%;
  height: 160px;
  display: block;
  border-radius: 4px;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 160px;
  background: #f5f7fa;
  color: #909399;
  font-size: 32px;
}

/* 底部区域 - Checkbox + Filename */
.example-footer {
  margin-top: 10px;
}

.example-footer :deep(.el-checkbox) {
  width: 100%;
  display: flex;
  align-items: center;
}

.example-footer :deep(.el-checkbox__label) {
  display: flex;
  align-items: center;
  width: 100%;
  padding-left: 8px;
}

.example-footer :deep(.el-checkbox__input) {
  flex-shrink: 0;
}

.example-filename {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  line-height: 1.5;
}

/* 操作按钮区域 */
.examples-actions {
  margin-top: 16px;
  text-align: right;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}
</style>
