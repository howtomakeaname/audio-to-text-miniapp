import { defineStore } from '@mpxjs/pinia'
import mpx, { ref, computed } from '@mpxjs/core'
import { wxLogin, getUserInfo } from '../api/auth'
import { getToken, setToken, clearToken } from '../utils/request'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(getToken())
  const userInfo = ref(null)
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)

  // Actions
  const setUserToken = (newToken) => {
    token.value = newToken
    setToken(newToken)
  }

  const setUserInfo = (info) => {
    userInfo.value = info
  }

  // 微信登录
  const login = async () => {
    try {
      // 获取微信登录凭证
      const loginRes = await mpx.login()
      
      if (!loginRes.code) {
        throw new Error('获取微信登录凭证失败')
      }

      // 调用后端登录接口
      const res = await wxLogin(loginRes.code)
      const { token: newToken, user } = res.data

      // 保存token和用户信息
      setUserToken(newToken)
      setUserInfo(user)

      return { success: true, user }
    } catch (error) {
      console.error('登录失败', error)
      throw error
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const res = await getUserInfo()
      setUserInfo(res.data)
      return res.data
    } catch (error) {
      console.error('获取用户信息失败', error)
      throw error
    }
  }

  // 退出登录
  const logout = () => {
    token.value = null
    userInfo.value = null
    clearToken()
  }

  // 检查登录状态
  const checkLoginStatus = async () => {
    const currentToken = getToken()
    if (!currentToken) {
      return false
    }
    
    try {
      // 尝试获取用户信息来验证token有效性
      await fetchUserInfo()
      return true
    } catch (error) {
      // Token无效，清除登录状态
      logout()
      return false
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setUserToken,
    setUserInfo,
    login,
    fetchUserInfo,
    logout,
    checkLoginStatus
  }
})
