import request from '../utils/request'

/**
 * 获取文件列表
 * @param {Object} params - 查询参数 {page, limit, status}
 * @returns {Promise}
 */
export const getFileList = (params = {}) => {
  const { page = 1, limit = 20, status = 'active' } = params
  return request({
    url: '/files',
    method: 'GET',
    data: { page, limit, status }
  })
}

/**
 * 获取文件详情
 * @param {number} id - 文件ID
 * @returns {Promise}
 */
export const getFileDetail = (id) => {
  return request({
    url: `/files/${id}`,
    method: 'GET'
  })
}

/**
 * 删除文件
 * @param {number} id - 文件ID
 * @returns {Promise}
 */
export const deleteFile = (id) => {
  return request({
    url: `/files/${id}`,
    method: 'DELETE'
  })
}

/**
 * 重命名文件
 * @param {number} id - 文件ID
 * @param {string} originalName - 新的文件名称
 * @returns {Promise}
 */
export const renameFile = (id, originalName) => {
  return request({
    url: `/files/${id}/rename`,
    method: 'PUT',
    data: { originalName }
  })
}

/**
 * 创建文件记录并启动转录
 * @param {Object} data - {originalName, ossKey, fileSize, mimeType}
 * @returns {Promise}
 */
export const createFileWithTranscription = (data) => {
  return request({
    url: '/files/with-transcription',
    method: 'POST',
    data
  })
}

/**
 * 获取音频文件的签名播放 URL
 * @param {number} id - 文件ID
 * @param {number} expires - 过期时间（秒，60-86400）
 * @returns {Promise}
 */
export const getAudioPlayUrl = (id, expires = 3600) => {
  return request({
    url: `/audio/${id}/play-url`,
    method: 'GET',
    data: { expires }
  })
}

/**
 * 刷新音频文件的签名播放 URL
 * @param {number} id - 文件ID
 * @param {number} expires - 过期时间（秒，60-86400）
 * @returns {Promise}
 */
export const refreshAudioPlayUrl = (id, expires = 3600) => {
  return request({
    url: `/audio/${id}/refresh-play-url`,
    method: 'POST',
    data: { expires }
  })
}
