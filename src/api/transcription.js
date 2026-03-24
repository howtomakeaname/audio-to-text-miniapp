import request from '../utils/request'

/**
 * 创建转录任务
 * @param {number} audioFileId - 音频文件ID
 * @param {Object} options - 转录选项 {language, prompt, enableSummary}
 * @returns {Promise}
 */
export const createTranscription = (audioFileId, options = {}) => {
  const { language, prompt, enableSummary = true } = options
  return request({
    url: '/transcriptions',
    method: 'POST',
    data: {
      audioFileId,
      options: {
        language,
        prompt,
        enableSummary
      }
    }
  })
}

/**
 * 查询转录任务状态
 * @param {number} id - 转录任务ID
 * @returns {Promise}
 */
export const getTranscriptionStatus = (id) => {
  return request({
    url: `/transcriptions/${id}`,
    method: 'GET'
  })
}

/**
 * 重新执行转录任务
 * @param {number} id - 转录任务ID
 * @param {Object} options - 新的转录选项
 * @returns {Promise}
 */
export const retryTranscription = (id, options = {}) => {
  return request({
    url: `/transcriptions/${id}/retry`,
    method: 'POST',
    data: { options }
  })
}
