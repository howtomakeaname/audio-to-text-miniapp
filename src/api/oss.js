import request from '../utils/request'
import { uploadToOSS } from '../utils/request'

/**
 * 获取OSS直传签名
 * @param {string} filename - 原始文件名
 * @param {string} contentType - 文件MIME类型
 * @returns {Promise}
 */
export const getOSSSignature = (filename, contentType) => {
  return request({
    url: '/oss/signature',
    method: 'POST',
    data: {
      filename,
      contentType
    }
  })
}

/**
 * 上传文件到OSS
 * @param {string} filePath - 本地文件路径
 * @param {Object} signatureData - OSS签名数据
 * @returns {Promise}
 */
export const uploadFileToOSS = (filePath, signatureData) => {
  const { ossEndpoint, formData } = signatureData
  return uploadToOSS(filePath, formData, ossEndpoint)
}

/**
 * 完整的文件上传流程
 * @param {Object} file - 文件对象 {path, name, size, type}
 * @param {Function} onProgress - 进度回调
 * @returns {Promise}
 */
export const uploadFile = async (file, onProgress) => {
  try {
    // 1. 获取OSS签名
    const signRes = await getOSSSignature(file.name, file.type)
    const signatureData = signRes.data

    // 2. 上传文件到OSS
    await uploadFileToOSS(file.path, signatureData)

    return {
      success: true,
      data: signatureData
    }
  } catch (error) {
    console.error('上传失败', error)
    throw error
  }
}
