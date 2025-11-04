export default defineNuxtRouteMiddleware((to, from) => {
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
      const userAuth = JSON.parse(localStorage.getItem('userAuth') || '{}');
  
      // 未登录时，只允许访问白名单页面
      if (!token && !whitelist.includes(to.path)) {
        return navigateTo('/login');
      }
      // 管理员可以访问所有页面
      if (userAuth.is_superuser) return;
      // 通用权限检查逻辑
      for (const path in permissionMap) {
        if (to.path.startsWith(path)) {
          const requiredKey = permissionMap[path];
          const hasPermission = userAuth[requiredKey];
  
          if (!hasPermission) {
            return navigateTo('/');
          }
        }
      }

    }
  });