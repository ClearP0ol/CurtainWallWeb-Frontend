// composables/useExampleImages.ts
// 示例图片配置
// OSS 路径: oss://tongji-icw-2025/crack-detection/examples/

export const useExampleImages = () => {
  const baseUrl = 'http://8.159.143.133:9000/oss/download/crack-detection/examples'

  // 示例图片列表（需要先上传到 OSS）
  // 只需维护文件名，自动生成 URL
  const exampleFiles = [
    'example-1.jpg',
    'example-2.jpg',
    'example-3.jpg',
    'example-4.jpg',
    'example-5.jpg',
    // 添加更多文件名...
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
    ossPath: 'oss://tongji-icw-2025/crack-detection/examples/'
  }
}
