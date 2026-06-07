// composables/useExampleImages.ts
// 示例图片配置
// OSS 路径: oss://tongji-icw-2025/crack-detection/examples/

export const useExampleImages = () => {
  const baseUrl = 'http://8.159.143.133:9000/oss/download/crack-detection/examples'

  // 示例图片列表（需要先上传到 OSS）
  const examples = [
    {
      id: 1,
      name: '道路裂缝示例1',
      filename: 'road-crack-1.jpg',
      url: `${baseUrl}/road-crack-1.jpg`,
      description: '典型的道路表面裂缝',
      category: '道路'
    },
    {
      id: 2,
      name: '建筑墙体裂缝',
      filename: 'wall-crack-1.jpg',
      url: `${baseUrl}/wall-crack-1.jpg`,
      description: '建筑外墙裂缝检测',
      category: '建筑'
    },
    {
      id: 3,
      name: '桥梁裂缝示例',
      filename: 'bridge-crack-1.jpg',
      url: `${baseUrl}/bridge-crack-1.jpg`,
      description: '桥梁结构裂缝',
      category: '桥梁'
    },
    {
      id: 4,
      name: '混凝土裂缝',
      filename: 'concrete-crack-1.jpg',
      url: `${baseUrl}/concrete-crack-1.jpg`,
      description: '混凝土表面细小裂缝',
      category: '建筑'
    },
    {
      id: 5,
      name: '地面裂缝示例',
      filename: 'ground-crack-1.jpg',
      url: `${baseUrl}/ground-crack-1.jpg`,
      description: '地面沥青裂缝',
      category: '道路'
    }
  ]

  return {
    examples,
    baseUrl,
    ossPath: 'oss://tongji-icw-2025/crack-detection/examples/'
  }
}
