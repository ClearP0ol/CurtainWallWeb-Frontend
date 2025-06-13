<template>
  <div class="p-4 space-y-8">
    <!-- 修改用户名 -->
    <el-card header="更改用户名">
      <el-form :model="usernameForm" ref="usernameFormRef" label-width="100px">
        <el-form-item label="当前用户名">
          <el-input v-model="usernameForm.old_username" disabled />
        </el-form-item>
        <el-form-item label="新用户名" prop="new_username" :rules="[{ required: true, message: '请输入新用户名', trigger: 'blur' }]">
          <el-input v-model="usernameForm.new_username" placeholder="请输入新用户名" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitUsername">提交修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 修改密码 -->
    <el-card header="更改密码">
      <el-form :model="passwordForm" ref="passwordFormRef" label-width="100px" :rules="passwordRules">
        <el-form-item label="当前用户名">
          <el-input v-model="passwordForm.username" disabled />
        </el-form-item>
        <el-form-item label="旧密码" prop="old_password">
          <el-input v-model="passwordForm.old_password" placeholder="请输入旧密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="passwordForm.new_password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirm_password">
          <el-input v-model="passwordForm.confirm_password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitPassword">提交修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { jwtDecode } from 'jwt-decode'

// 获取token并解码用户名
const authToken = localStorage.getItem('authToken') || ''
const decoded = authToken ? jwtDecode<{ username: string }>(authToken) : { username: '' }
const currentUsername = decoded.username || ''

// 用户名表单
const usernameForm = ref({
  old_username: '',
  new_username: '',
})
const usernameFormRef = ref()

// 密码表单
const passwordForm = ref({
  username: '',
  old_password: '',
  new_password: '',
  confirm_password: '',
})
const passwordFormRef = ref()

// 表单校验规则
const passwordRules = {
  old_password: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  new_password: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== passwordForm.value.new_password) {
          callback(new Error('两次输入的新密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

onMounted(() => {
  usernameForm.value.old_username = currentUsername
  passwordForm.value.username = currentUsername
})

const submitUsername = () => {
  usernameFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    console.log('发送请求体:', usernameForm.value)
    try {
      await $fetch('/api/account/custom/updateUsername', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: usernameForm.value,
      })
      ElMessage.success('用户名修改成功')
    } catch (err) {
      ElMessage.error('修改失败，请检查输入')
      console.error(err)
    }
  })
}

const submitPassword = () => {
  passwordFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    try {
      console.log('发送请求体:', passwordForm.value)
      // 注意去除 confirm_password 字段，后端一般不需要确认字段
      const { username, old_password, new_password } = passwordForm.value
      await $fetch('/api/account/custom/updatePassword', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: { username, old_password, new_password },
      })
      ElMessage.success('密码修改成功')
    } catch (err) {
      ElMessage.error('修改失败，请检查输入')
      console.error(err)
    }
  })
}
</script>

<style scoped>
.p-4 {
  padding: 1rem;
  display: flex;
  flex-direction: column; /* 竖直排列 */
  align-items: center; /* 容器内内容水平居中 */
  gap: 2rem; /* 模块间距 */
  width: 100vw; /* 占满横屏宽度 */
  box-sizing: border-box;
}

.el-card {
  width: 100%; /* 卡片宽度撑满父容器 */
  max-width: 600px; /* 最大宽度限制 */
}
</style>

