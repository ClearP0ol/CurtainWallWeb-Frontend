// sendSms.js
import axios from 'axios';
import crypto from 'crypto';

// 签名生成函数
function sign(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const query = sortedKeys.map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
  const stringToSign = `POST&%2F&${encodeURIComponent(query)}`;
  return crypto.createHmac('sha1', `${secret}&`).update(stringToSign).digest('base64');
}

export default async function sendSms(phoneNumber, signName, templateCode, templateParam) {
  try {
    const accessKeyId = 'LTAI5t7Ub6kT49zosw4KGLt4';  // 替换为您的 AccessKey ID
    const accessSecret = '7bI4lqzDiV72R3hmicTN7OBqtc96KG';  // 替换为您的 AccessKey Secret
    const params = {
      PhoneNumbers: phoneNumber,
      SignName: signName,
      TemplateCode: templateCode,
      TemplateParam: JSON.stringify(templateParam),
      AccessKeyId: accessKeyId,
      Action: 'SendSms',
      Format: 'JSON',
      RegionId: 'cn-hangzhou',
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: Date.now().toString(),
      SignatureVersion: '1.0',
      Timestamp: new Date().toISOString(),
      Version: '2017-05-25',
    };

    // 生成签名
    params.Signature = sign(params, accessSecret);

    // 使用 axios 发送 POST 请求
    const response = await axios.post('https://dysmsapi.aliyuncs.com/', null, { params });
    if (response.data.Code === 'OK') {
      console.log('短信发送成功');
      return { success: true, message: '短信发送成功' };
    } else {
      console.error('短信发送失败:', response.data.Message);
      return { success: false, message: response.data.Message };
    }
  } catch (error) {
    console.error('发送短信时出错:', error);
    return { success: false, message: error.message };
  }
}
