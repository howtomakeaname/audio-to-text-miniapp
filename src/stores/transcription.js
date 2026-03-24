import { defineStore } from '@mpxjs/pinia'
import { ref, computed } from '@mpxjs/core'
import {
  createTranscription,
  getTranscriptionStatus,
  retryTranscription
} from '../api/transcription'

export const useTranscriptionStore = defineStore('transcription', () => {
  // State
  const currentTask = ref(null)
  const taskList = ref([])
  const loading = ref(false)
  const pollingInterval = ref(null)

  // Getters
  const isProcessing = computed(() => 
    currentTask.value?.status === 'processing' || currentTask.value?.status === 'pending'
  )
  
  const isCompleted = computed(() => currentTask.value?.status === 'completed')
  
  const isFailed = computed(() => currentTask.value?.status === 'failed')

  // Actions
  const setCurrentTask = (task) => {
    currentTask.value = task
  }

  const addTask = (task) => {
    taskList.value.unshift(task)
  }

  const updateTask = (taskId, updates) => {
    // 更新任务列表中的任务
    const index = taskList.value.findIndex(t => t.id === taskId)
    if (index !== -1) {
      taskList.value[index] = { ...taskList.value[index], ...updates }
    }
    
    // 如果当前任务被更新，也更新currentTask
    if (currentTask.value && currentTask.value.id === taskId) {
      currentTask.value = { ...currentTask.value, ...updates }
    }
  }

  // 创建转录任务
  const createTask = async (audioFileId, options = {}) => {
    loading.value = true
    try {
      const res = await createTranscription(audioFileId, options)
      const task = res.data
      
      setCurrentTask(task)
      addTask(task)
      
      return task
    } catch (error) {
      console.error('创建转录任务失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 查询转录任务状态
  const fetchTaskStatus = async (taskId) => {
    try {
      const res = await getTranscriptionStatus(taskId)
      const task = res.data
      
      updateTask(taskId, task)
      
      // 如果任务完成或失败，停止轮询
      if (task.status === 'completed' || task.status === 'failed') {
        stopPolling()
      }
      
      return task
    } catch (error) {
      console.error('查询转录任务状态失败', error)
      throw error
    }
  }

  // 开始轮询任务状态
  const startPolling = (taskId, interval = 3000) => {
    // 先停止之前的轮询
    stopPolling()
    
    // 立即查询一次
    fetchTaskStatus(taskId)
    
    // 开始定时轮询
    pollingInterval.value = setInterval(() => {
      fetchTaskStatus(taskId)
    }, interval)
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }

  // 重试转录任务
  const retryTask = async (taskId, options = {}) => {
    loading.value = true
    try {
      const res = await retryTranscription(taskId, options)
      const task = res.data
      
      updateTask(taskId, task)
      setCurrentTask(task)
      
      return task
    } catch (error) {
      console.error('重试转录任务失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    currentTask,
    taskList,
    loading,
    pollingInterval,
    // Getters
    isProcessing,
    isCompleted,
    isFailed,
    // Actions
    setCurrentTask,
    addTask,
    updateTask,
    createTask,
    fetchTaskStatus,
    startPolling,
    stopPolling,
    retryTask
  }
})
