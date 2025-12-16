import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export default defineNuxtRouteMiddleware(async (to, from) => {
    const whitelist = ['/login'];

    const permissionMap = {
        '/3DModel': 'access_system_a',//无人机采集数据的3D建模与通讯系统
        '/stonedirty': 'access_system_b',//√石材幕墙污渍检测系统
        '/crackdetect': 'access_system_c',//√石材幕墙裂缝检测系统
        '/spallingDetection': 'access_system_d',//玻璃幕墙爆裂检测系统
        '/monitor': 'access_system_v',//√幕墙震动数据检测与展示系统
        '/segment': 'access_system_f',//幕墙材质分割
        '/smoothnessDetection': 'access_system_g',//玻璃幕墙平整度检测系统
        '/resilienceAssessment': 'access_system_h',//√多维数据幕墙韧性评估系统
        '/corrosiondetection': 'access_system_z',//金属幕墻锈蚀污损检测系统
        '/userManage': 'is_superuser', // 管理页面仅限管理员
      };
  
    if (process.client) {
      const token = localStorage.getItem('authToken');
      
      // 1. 无 token 时，强制跳转登录（除白名单外）
      if (!token) {
        if (!whitelist.includes(to.path)) {
          console.log('❌ 未登录，跳转到登录页');
          return navigateTo('/login');
        }
        return; // 白名单页面直接放行
      }

      // 2. 验证 token 是否过期
      try {
        const decoded = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (decoded.exp && decoded.exp < currentTime) {
          console.log('❌ Token 已过期，清除认证信息并跳转登录');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userAuth');
          localStorage.removeItem('email');
          return navigateTo('/login');
        }
      } catch (error) {
        console.error('❌ Token 解析失败，清除认证信息:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userAuth');
        localStorage.removeItem('email');
        return navigateTo('/login');
      }

      // 3. 检查并同步权限信息
      let userAuth = JSON.parse(localStorage.getItem('userAuth') || '{}');
      
      // 即使有本地权限缓存，也要向服务器验证 token 是否仍然有效
      // 这样可以确保 token 过期后立即失效
      try {
        const response = await axios.get('/api/account/custom/getPermissions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.data) {
          userAuth = response.data.data;
          localStorage.setItem('userAuth', JSON.stringify(userAuth));
          console.log('✅ 权限信息已验证并更新');
        } else {
          throw new Error('权限信息格式错误');
        }
      } catch (error) {
        console.error('❌ 权限验证失败:', error);
        // Token 无效或过期（401），清除所有认证信息
        if (error.response?.status === 401) {
          console.log('❌ Token 验证失败（401），清除认证信息');
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('userAuth');
        localStorage.removeItem('email');
        return navigateTo('/login');
      }

      // 4. 白名单页面直接放行
      if (whitelist.includes(to.path)) {
        return;
      }

      // 5. 管理员可以访问所有页面
      if (userAuth.is_superuser) {
        console.log('✅ 管理员身份，允许访问所有页面');
        return;
      }
      
      // 6. 首页放行（所有登录用户都可以访问）
      if (to.path === '/') {
        return;
      }

      // 7. 检查具体页面权限
      for (const path in permissionMap) {
        if (to.path.startsWith(path)) {
          const requiredKey = permissionMap[path];
          const hasPermission = userAuth[requiredKey];
  
          if (!hasPermission) {
            console.log(`❌ 无权限访问 ${to.path}，需要权限: ${requiredKey}`);
            return navigateTo('/');
          }
          
          console.log(`✅ 有权限访问 ${to.path}`);
          return;
        }
      }
    }
  });