import request from '../utils/request'

/**
 * 微信登录
 * @param {string} code - 微信登录凭证
 * @returns {Promise}
 */
export const wxLogin = (code) => {
  return request({
    url: '/auth/login',
    method: 'POST',
    data: { code }
  })
}

/**
 * 刷新Token
 * @returns {Promise}
 */
export const refreshToken = () => {
  return request({
    url: '/auth/refresh',
    method: 'POST'
  })
}

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
export const getUserInfo = () => {
  return request({
    url: '/auth/me',
    method: 'GET'
  })
}
