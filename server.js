// server.js
import express from "express";
import sendEmail from "./sendEmail.js"; // 使用 ES 模块的 import
import ALY from 'aliyun-sdk';
import sendSms from './sendSms.js';
import cors from "cors"
const app = express();


// 使用 CORS 中间件来允许跨域请求
app.use(cors());  // 允许所有来源的请求

// 使用 bodyParser 中间件来解析请求体


app.use(express.json());

app.post("/api/alert", (req, res) => {
  const { alertMessage } = req.body;
  sendEmail(alertMessage)
    .then(() => res.status(200).send("警报邮件已发送"))
    .catch((error) => res.status(500).send("邮件发送失败：" + error.message));
});


app.post('/api/send_sms', async (req, res) => {
  const { phoneNumber, signName, templateCode, templateParam } = req.body;

  const result = await sendSms(phoneNumber, signName, templateCode, templateParam);
  if (result.success) {
    res.status(200).send(result.message);
  } else {
    res.status(500).send(result.message);
  }
});


app.listen(3001, () => {
  console.log("Server running on port 3001");
});
