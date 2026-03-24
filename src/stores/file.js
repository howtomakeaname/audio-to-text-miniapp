import { defineStore } from '@mpxjs/pinia'
import { ref, computed } from '@mpxjs/core'
import { getFileList, getFileDetail, deleteFile } from '../api/file'

export const useFileStore = defineStore('file', () => {
  // State
  const fileList = ref([])
  const currentFile = ref(null)
  const loading = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // Getters
  const files = computed(() => fileList.value)
  const fileCount = computed(() => fileList.value.length)
  
  // 按状态分组的文件
  const processingFiles = computed(() => 
    fileList.value.filter(f => f.transcriptionStatus === 'processing' || f.transcriptionStatus === 'pending')
  )
  
  const completedFiles = computed(() => 
    fileList.value.filter(f => f.transcriptionStatus === 'completed')
  )
  
  const failedFiles = computed(() => 
    fileList.value.filter(f => f.transcriptionStatus === 'failed')
  )

  // Actions
  const setFileList = (list) => {
    fileList.value = list
  }

  const setCurrentFile = (file) => {
    currentFile.value = file
  }

  const addFile = (file) => {
    fileList.value.unshift(file)
  }

  const updateFile = (fileId, updates) => {
    const index = fileList.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      fileList.value[index] = { ...fileList.value[index], ...updates }
    }
    // 如果当前查看的文件被更新，也更新currentFile
    if (currentFile.value && currentFile.value.id === fileId) {
      currentFile.value = { ...currentFile.value, ...updates }
    }
  }

  const removeFile = (fileId) => {
    fileList.value = fileList.value.filter(f => f.id !== fileId)
    if (currentFile.value && currentFile.value.id === fileId) {
      currentFile.value = null
    }
  }

  // 获取文件列表
  const fetchFileList = async (params = {}, append = false) => {
    if (loading.value) return
    
    loading.value = true
    try {
      const page = append ? currentPage.value + 1 : 1
      const res = await getFileList({
        page,
        limit: pageSize.value,
        ...params
      })
      
      const { items, pagination } = res.data
      
      if (append) {
        fileList.value = [...fileList.value, ...items]
        currentPage.value = page
      } else {
        fileList.value = items
        currentPage.value = 1
      }
      
      hasMore.value = pagination.hasMore
      
      return { success: true, data: items }
    } catch (error) {
      console.error('获取文件列表失败', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取文件详情
  const fetchFileDetail = async (fileId) => {
    try {
      const res = await getFileDetail(fileId)
      const file = res.data
      
      // 更新本地数据
      setCurrentFile(file)
      updateFile(fileId, file)
      
      return file
    } catch (error) {
      console.error('获取文件详情失败', error)
      throw error
    }
  }

  // 删除文件
  const removeFileById = async (fileId) => {
    try {
      await deleteFile(fileId)
      removeFile(fileId)
      return { success: true }
    } catch (error) {
      console.error('删除文件失败', error)
      throw error
    }
  }

  // 清空文件列表
  const clearFiles = () => {
    fileList.value = []
    currentFile.value = null
    currentPage.value = 1
    hasMore.value = true
  }

  return {
    // State
    fileList,
    currentFile,
    loading,
    hasMore,
    currentPage,
    pageSize,
    // Getters
    files,
    fileCount,
    processingFiles,
    completedFiles,
    failedFiles,
    // Actions
    setFileList,
    setCurrentFile,
    addFile,
    updateFile,
    removeFile,
    fetchFileList,
    fetchFileDetail,
    removeFileById,
    clearFiles
  }
})
