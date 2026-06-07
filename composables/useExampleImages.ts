// composables/useExampleImages.ts
// 示例图片配置
// OSS 路径: oss://tongji-icw-2025/crack-detection/examples/dataset/

export const useExampleImages = () => {
  const baseUrl = 'http://8.159.143.133:9000/oss/download/crack-detection/examples/dataset'

  // 示例图片列表（需要先上传到 OSS）
  // 只需维护文件名，自动生成 URL
  const exampleFiles = [
    '0005.JPG',
    '0013.jpg',
    '0049.JPG',
    '0050.JPG',
    '0070.JPG',
    '0085.JPG',
    '0087.JPG',
    '0097.jpg',
    '222.jpg',
    'crack-000021.jpg',
    'crack-000022.jpg',
    'crack-000023.jpg',
    'crack-000024.jpg',
    'crack-000032.jpg',
    'crack-000044.jpg',
    'crack-000083.jpg',
    'crack-000137.jpg',
    'crack-000146.jpg',
    'crack-000163.jpg',
    'crack-000187.jpg',
    'crack-000191.jpg',
    'crack-000215.jpg',
    'crack-000275.jpg',
    'crack-000323.jpg',
    'crack-000338.jpg',
    'crack-000372.jpg',
    'crack-000398.jpg',
    'crack-000462.jpg',
    'crack-000536.jpg',
    'crack-000545.jpg',
    'crack-009271.jpg',
    'crack-009272.jpg',
    'crack-009284.jpg',
    'crack-009298.jpg',
    'crack-009307.jpg',
    'crack-009316.jpg',
    'crack-009330.jpg',
    'crack-009352.jpg',
    'crack-009353.jpg',
    'crack-009373.jpg',
    'crack-009384.jpg',
    'crack-009387.jpg',
    'rawimage104.jpg',
    'rawimage34.jpg',
    'rawimage62.jpg',
    'rawimage74.jpg',
    'rawimage83.jpg',
    'rawimage93.jpg',
    'test1.jpg',
  ]

  // 自动生成示例图片对象
  const examples = exampleFiles.map((filename, index) => ({
    id: index + 1,
    filename: filename,
    url: `${baseUrl}/${filename}`,
  }))

  return {
    examples,
    baseUrl,
    ossPath: 'oss://tongji-icw-2025/crack-detection/examples/dataset/'
  }
}
