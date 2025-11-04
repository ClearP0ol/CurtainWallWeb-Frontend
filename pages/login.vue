<!-- 登录页面 -->
<template>
  <div class="page">
    <!-- 登录表单 -->
    <div v-if="showLoginForm">
      <form @submit.prevent="login">
        <el-form class="form1">
          <span style="margin-bottom: 20px; font-size: 20px;">欢迎！请登录您的账户</span>
          <el-form-item>
            <el-input
                v-model="loginForm.email"
                placeholder="邮箱"
                required
                @keydown.enter="focusNextInput"
                ref="inputEmail"
            />
          </el-form-item>

          <el-form-item>
            <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                required
                @keydown.enter="login"
                ref="inputPassword"
            />
          </el-form-item>

          <el-form-item @click="login">
            <el-button>登录</el-button>
          </el-form-item>

          <el-form-item style="position: absolute; top: 80%">
            <p @click="toggleForm" style="color: rgb(193, 193, 193); cursor: pointer; margin-top:20px; font-size:15px">
              没有账户？点击注册
            </p>
          </el-form-item>
          <el-form-item style="text-align: center">
            <p @click="showResetForm = true; showLoginForm = false" style="color: rgb(193, 193, 193); cursor: pointer; font-size: 15px">
              忘记密码？
            </p>
          </el-form-item>

        </el-form>
      </form>
    </div>

    <!-- 注册表单 -->
    <div v-else-if="!showLoginForm && !showResetForm">
      <form @submit.prevent="register">
        <el-form class="form2">
          <span style="margin-bottom: 20px; font-size: 20px;">欢迎！请输入注册信息</span>
          <el-form-item>
            <el-input
                v-model="registerForm.email"
                placeholder="邮箱"
                required
                ref="inputEmail"
            />
          </el-form-item>

          <el-form-item>
            <el-input v-model="registerForm.code" placeholder="验证码" required>
              <template #suffix>
                <button
                    @click.prevent="sendVerificationCode()"
                    :disabled="disableButton"
                    style="color: white; background-color: RGB(0,102,204); padding: 0 10px; border-radius: 5px; cursor: pointer;"
                >
                  {{ buttonText }}
                </button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="输入密码"
                required
                ref="inputPassword"
            />
          </el-form-item>

          <el-form-item>
            <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="确认密码"
                required
                ref="inputPassword"
            />
          </el-form-item>

          <el-form-item>
            <el-button @click="register">注册</el-button>
          </el-form-item>

          <el-form-item style="position: absolute; top: 90%">
            <p
                @click="toggleForm"
                style="color: rgb(193, 193, 193); cursor: pointer;margin-top:20px; font-size:15px"
            >
              已有账户？点此登录
            </p>
          </el-form-item>
        </el-form>
      </form>
    </div>
    <!-- 忘记密码表单 -->
    <div v-if="showResetForm">
      <form @submit.prevent="resetPassword">
        <el-form class="form2">
          <span style="margin-bottom: 20px; font-size: 20px;">重置密码</span>

          <el-form-item>
            <el-input v-model="resetForm.email" placeholder="邮箱" required />
          </el-form-item>

          <el-form-item>
            <el-input v-model="resetForm.code" placeholder="验证码" required>
              <template #suffix>
                <button
                  @click.prevent="sendVerificationCode('reset')"
                  :disabled="disableButton"
                  style="color: white; background-color: RGB(0,102,204); padding: 0 10px; border-radius: 5px; cursor: pointer;"
                >
                  {{ buttonText }}
                </button>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-input
              v-model="resetForm.password"
              type="password"
              placeholder="新密码"
              required
            />
          </el-form-item>

          <el-form-item>
            <el-input
              v-model="resetForm.confirmPassword"
              type="password"
              placeholder="确认新密码"
              required
            />
          </el-form-item>

          <el-form-item>
            <el-button @click="resetPassword">重置密码</el-button>
          </el-form-item>

          <el-form-item>
            <p
              @click="showResetForm = false; showLoginForm = true"
              style="color: rgb(193, 193, 193); cursor: pointer; font-size:15px"
            >
              返回登录
            </p>
          </el-form-item>
        </el-form>
      </form>
    </div>

    <!-- <el-button @click="GoToLayout">点击跳转排版页面</el-button> -->
  </div>
</template>

<script setup>
import userService from "~/api/user.js";
import {onMounted, ref} from "vue";
import {useRouter} from "vue-router";
import {ElMessage, ElLoading} from "element-plus";
import * as jwtDecode from 'jwt-decode';
import axios from "axios";

// import store from '@/store/index.js'

// const GoToLayout = () => {
//   router.push({
//     name: 'layout',
//     params: {
//       choice: 'dashboard'
//     }
//   })
// }

const router = useRouter();
const showLoginForm = ref(true);
const userStore = userService;
const inputEmail = ref(null);
const inputPassword = ref(null);
const showResetForm = ref(false);

const loginForm = ref({
  email: "",
  password: "",
});

const registerForm = ref({
  email: "",
  code: "",
  password: "",
  confirmPassword: "",
});

const resetForm = ref({
  email: "",
  code: "",
  password: "",
  confirmPassword: "",
});

const focusNextInput = () => {
  inputPassword.value.focus();
};

//todo: 暂时不发请求，需要统一api，先直接写死
const login = async () => {
  let loadingInstance = null;
  try {
    loadingInstance = ElLoading.service({
      lock: true,
      text: "正在登录...",
      background: "rgba(0, 0, 0, 0.7)",
    });
    const response = await $fetch("/api/account/login", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        username: loginForm.value.email,
        password: loginForm.value.password,
      },
    });
    console.log('登录响应:', response); // 添加日志

    if (loadingInstance) loadingInstance.close();

    // 检查响应结构
    const token = response.token || response.data?.token;
    if (token) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("email", loginForm.value.email);

      // 验证 token 是否正确存储
      const storedToken = localStorage.getItem("authToken");
      console.log("存储的 token:", storedToken);

      // 尝试解析 token
      try {
        const decoded = jwtDecode(storedToken);
        console.log("解析后的 token:", decoded);
      } catch (e) {
        console.error("Token 解析失败:", e);
      }
      //  立即获取用户权限并保存
      try {
        const permissionRes = await axios.get("/api/account/custom/getPermissions", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        //保存权限结构
        localStorage.setItem("userAuth", JSON.stringify(permissionRes.data.data));
        //验证权限是否正确存储
        console.log("已保存权限结构:", permissionRes.data.data);
      } catch (err) {
        console.error("权限获取失败:", err);
        ElMessage.error("权限获取失败，请联系管理员");
        return;
      }

      // //  权限写入成功，再跳转首页

      router.push({path: "/"});
    } else {
      console.error("登录响应中没有 token:", response);
      ElMessage.error("登录失败，未获取到认证信息");
    }
  } catch (error) {
    console.error('登录错误:', error);
    ElMessage.error(error.data?.message || "登录失败，请检查用户名和密码");
  } finally {
    if (loadingInstance) loadingInstance.close();
  }
};

const disableButton = ref(false);
const buttonText = ref("发送验证码");
const countdown = ref(60);

// const sendVerificationCode = async () => {
//   if (disableButton.value) {
//     return;
//   }

//   // 2. 验证邮箱格式
//   const email = registerForm.value.email;
//   if (!email) {
//     ElMessage.error('请输入邮箱地址');
//     return;
//   }

//   // 邮箱正则表达式
//   const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//   if (!emailRegex.test(email)) {
//     ElMessage.error('请输入有效的邮箱地址');
//     return;
//   }

//   disableButton.value = true;
//   startCountdown();
//   try {
//     const response = await $fetch("/api/account/sendCode", {
//       method: "POST",
//       // body: {email: registerForm.value.email},
//       body: {
//         email,
//         method: type, // 使用 "register" 或 "reset"
//       },
//     });
//   } catch (error) {
//     console.error('Error response:', error.response);
//     ElMessage.error(error.response._data.message);
//   }
// };

const sendVerificationCode = async (method = "register") => {
  const email = method === 'reset' ? resetForm.value.email : registerForm.value.email;

  if (!email) {
    ElMessage.error('请输入邮箱地址');
    return;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    ElMessage.error('请输入有效的邮箱地址');
    return;
  }

  disableButton.value = true;
  startCountdown();

  console.log('🔍 [DEBUG] 开始发送验证码请求');
  console.log('📧 [DEBUG] 邮箱:', email);
  console.log('🏷️ [DEBUG] 方法:', method);
  console.log('🌐 [DEBUG] 请求 URL: /api/account/sendCode');
  console.log('📦 [DEBUG] 请求 Body:', { email, method });

  try {
    const response = await $fetch("/api/account/sendCode", {
      method: "POST",
      body: {
        email,
        method, // "register" or "reset"
      },
    });

    console.log('✅ [DEBUG] 请求成功，响应:', response);
    console.log('📊 [DEBUG] 响应状态: 成功 (假设 200)');

    ElMessage.success('验证码发送成功');
  } catch (error) {
    console.error('❌ [DEBUG] 验证码发送失败，详细错误信息:');
    console.error('🔍 [DEBUG] 错误对象:', error);
    console.error('📊 [DEBUG] 错误状态码:', error?.status || '未知');
    console.error('🌐 [DEBUG] 错误响应:', error?.response || '无响应对象');
    console.error('📝 [DEBUG] 错误消息:', error?.message || '无消息');
    console.error('📦 [DEBUG] 响应数据:', error?.response?._data || error?.data || '无数据');
    console.error('🔗 [DEBUG] 请求 URL (可能被代理):', 'http://1.117.69.116/api/account/sendCode (前端) -> http://110.42.214.164:8008/api/account/sendCode (代理目标)');

    // 检查是否是 502
    if (error?.status === 502) {
      console.error('🚨 [DEBUG] 检测到 502 Bad Gateway！这表示代理从上游服务器收到无效响应。');
      console.error('🔍 [DEBUG] 可能原因: 上游服务器 (110.42.214.164:8008) 不可达、宕机或返回错误。');
    }

    ElMessage.error(error?.response?._data?.message || '验证码发送失败');
  }
};

const startCountdown = () => {
  const countdownInterval = setInterval(() => {
    countdown.value--;

    if (countdown.value <= 0) {
      clearInterval(countdownInterval);
      resetCountdown();
    } else {
      buttonText.value = `${countdown.value} 秒后重试`;
    }
  }, 1000);
};

const resetCountdown = () => {
  countdown.value = 60;
  disableButton.value = false;
  buttonText.value = "发送验证码";
};

const resetPassword = async () => {
  if (resetForm.value.password !== resetForm.value.confirmPassword) {
    ElMessage.error("两次输入的密码不一致");
    return;
  }

  try {
    const response = await $fetch("/api/account/validate", {
      method: "POST",
      body: {
        email: resetForm.value.email,
        code: resetForm.value.code,
        password: resetForm.value.password,
      },
    });

    if (response?.code === 200) {
      ElMessage.success("密码重置成功，请登录");
      showResetForm.value = false;
      showLoginForm.value = true;
    } else {
      ElMessage.error(response.message || "密码重置失败");
    }
  } catch (err) {
    console.error("密码重置错误:", err);
    ElMessage.error(err?.response?._data?.message || "密码重置失败");
  }
};


const register = async () => {
  if (registerForm.value.password != registerForm.value.confirmPassword) {
    ElMessage.error("两次密码输入不一致，请重新输入密码");
    return
  }
  try {
    const response = await $fetch("/api/account/validate", {
      method: "POST",
      body: {
        email: registerForm.value.email,
        code: registerForm.value.code,
        password: registerForm.value.password,
      },
    });
    if (response) {
      // console.log(response.code);
      if (response.code !== 200) {
        ElMessage.error(response.message);
        return;
      }
      ElMessage.success("注册成功");
      showLoginForm.value = true;
    }
  } catch (error) {
    // console.error(error.message);
    // ElMessage.error(response.message || "注册错误");
  }

  // 实现注册逻辑
  // const success = await userStore.register(
  //   registerForm.value.email,
  //   registerForm.value.code,
  //   registerForm.value.password
  // );

  // if (success) {
  //   toggleForm;
  // }
};

const logout = () => {
  // 实现退出登录逻辑
  userStore.clearUserInfo();
};

const toggleForm = () => {
  showLoginForm.value = !showLoginForm.value;
};

onMounted(() => {
  // userStore.clearUserInfo()
});

definePageMeta({
  layout: false,
});
</script>

<style scoped>
.page {
  background-image: url("/assets/images/background.png");
  background-size: cover;
  position: relative;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
}

.form1 {
  position: absolute;
  color: white;
  top: 35%;
  left: 70%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.el-form-item + .el-form-item {
  margin-top: 20px;
  /* 设置间距大小 */
}

.el-input {
  height: 28px;
  width: 250px;
}

/*搜索组件最外层div */
.input_box {
  margin-right: 15px;
}

/*搜索input框 */
:deep(.el-input__wrapper) {
  background-color: white;
  /*覆盖原背景颜色，设置成透明 */
  border-radius: 5px;
  width: 550px;
  height: 40px;
  border-color: black;
}

.el-button {
  height: 37px;
  width: 198px;
  background-color: rgb(4, 4, 80);
  color: white;
  border-color: transparent;
}

.el-button:hover {
  background-color: rgb(6, 6, 117);
  color: white;
  border-color: transparent;
}

.form2 {
  position: absolute;
  color: white;
  top: 25%;
  left: 70%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
