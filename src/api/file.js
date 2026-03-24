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
