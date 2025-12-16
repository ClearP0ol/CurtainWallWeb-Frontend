import request from '../utils/request'

// 污渍检测接口
export const detectStain = async (imageUrl, username) => {
  try {
    console.log('发送检测请求:', {
      image_url: imageUrl,
      username: username
    });
    
    const response = await request({
      url: '/predict',
      method: 'post',
      baseURL: '/', // 使用 Nuxt 代理转发到远程服务器
      data: {
        image_url: imageUrl,
        username: username
      }
    });
    
    console.log('检测响应:', response);
    return response;
  } catch (error) {
    console.error('检测接口错误:', error);
    throw error;
  }
};

// 获取历史记录接口
export const getHistory = async (params) => {
  try {
    console.log('发送历史记录请求:', params);
    const response = await request({
      url: '/history',
      method: 'post',
      baseURL: '/', // 使用 Nuxt 代理转发到远程服务器
      skipErrorHandler: true, // 跳过全局错误处理，在组件中单独处理
      data: params
    });
    console.log('历史记录响应:', response);
    return response;
  } catch (error) {
    console.error('获取历史记录失败:', error);
    throw error;
  }
};