import mpx from '@mpxjs/core'
import mpxFetch from '@mpxjs/fetch'

mpx.use(mpxFetch)

const BASE_URL = process.env.BASE_URL || 'https://api.example.com/v1'

// 获取存储的token
const getToken = () => {
  try {
    return mpx.getStorageSync('token')
  } catch (e) {
    return null
  }
}

// 保存token
const setToken = (token) => {
  try {
    mpx.setStorageSync('token', token)
  } catch (e) {
    console.error('保存token失败', e)
  }
}

// 清除token
const clearToken = () => {
  try {
    mpx.removeStorageSync('token')
  } catch (e) {
    console.error('清除token失败', e)
  }
}

// 请求拦截
const request = (options = {}) => {
  const { url, method = 'GET', data, header = {} } = options
  
  const token = getToken()
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}
  
  return new Promise((resolve, reject) => {
    mpx.fetch({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...header
      },
      success: (res) => {
        const { statusCode, data: responseData } = res
        
        if (statusCode >= 200 && statusCode < 300) {
          // 业务逻辑成功
          if (responseData.code === 0) {
            resolve(responseData)
          } else {
            // 业务错误
            mpx.showToast({
              title: responseData.message || '请求失败',
              icon: 'none'
            })
            reject(responseData)
          }
        } else if (statusCode === 401) {
          // Token过期，清除token并跳转到登录
          clearToken()
          mpx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          })
          reject({ code: 401, message: 'Token过期' })
        } else {
          // 其他HTTP错误
          mpx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          })
          reject({ code: statusCode, message: '网络错误' })
        }
      },
      fail: (err) => {
        mpx.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject({ code: -1, message: '网络请求失败', error: err })
      }
    })
  })
}

// 上传文件到OSS
const uploadToOSS = (filePath, formData, ossEndpoint) => {
  return new Promise((resolve, reject) => {
    mpx.uploadFile({
      url: ossEndpoint,
      filePath,
      name: 'file',
      formData,
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve(res)
        } else {
          reject({ code: res.statusCode, message: '上传失败' })
        }
      },
      fail: (err) => {
        reject({ code: -1, message: '上传失败', error: err })
      }
    })
  })
}

export {
  request,
  uploadToOSS,
  getToken,
  setToken,
  clearToken
}

export default request
