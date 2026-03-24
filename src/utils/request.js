import mpx from '@mpxjs/core'

const BASE_URL = (process.env.BASE_URL && process.env.BASE_URL !== '/') ? process.env.BASE_URL : 'http://localhost:3000'

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
    mpx.request({
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
    // 拷贝一份formData避免修改原对象
    const data = { ...formData };
    
    // 如果存在 policy 字段，确保其它参数和 policy 一起发送，不要漏掉 file
    // file 必须是表单中的最后一个字段，mpx.uploadFile 中通过 name 指定
    
    // 为了防止签名不匹配，我们需要确保 x-oss 相关的请求字段顺序或内容符合 OSS 官方要求，
    // 特别是上传时的 content-type 要和签名时一致（如果有的话），以及确保 filePath 对应的 key 等字段都在 formData 中
    
    mpx.uploadFile({
      url: ossEndpoint,
      filePath,
      name: 'file', // OSS 要求文件字段名为 file，且必须放在表单最后
      formData: data,
      success: (res) => {
        // OSS 默认返回 204 No Content，或者根据 success_action_status 返回 200
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res)
        } else {
          reject({ code: res.statusCode, message: '上传失败', data: res.data })
        }
      },
      fail: (err) => {
        reject({ code: -1, message: '上传网络错误', error: err })
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
