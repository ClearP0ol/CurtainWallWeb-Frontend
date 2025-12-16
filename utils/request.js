import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const request = axios.create({
<<<<<<< HEAD
  baseURL: 'http://8.153.161.229:8007', // 直接使用服务器地址
=======
  baseURL: 'http://localhost:8000', // 使用本地 Spring Boot 后端
>>>>>>> origin/cza
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false  // 跨域请求不需要携带凭证
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加 token
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    return res
  },
  error => {
    console.error('响应错误:', error)
    
    // 如果配置了跳过错误处理，直接返回 reject
    if (error.config && error.config.skipErrorHandler) {
      return Promise.reject(error)
    }

    // 更详细的错误提示
    if (error.response) {
      // 服务器返回了错误状态码
      ElMessage.error(error.response.data?.message || '请求失败')
    } else if (error.request) {
      // 请求发出去了但没有收到响应
      ElMessage.error('服务器无响应，请检查网络连接')
    } else {
      // 请求配置出错
      ElMessage.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

export default request
