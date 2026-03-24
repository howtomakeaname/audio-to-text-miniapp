# 文件上传与转录流程设计

## 问题

用户上传文件到 OSS 后，后端需要自动创建转录任务。

## 推荐方案：前端上传成功后通知后端

### 流程图

```
┌──────────────┐     1. 请求签名      ┌──────────────┐
│   微信小程序  │ ──────────────────▶ │    后端服务   │
│  (前端)       │                     │              │
└──────────────┘                     └──────────────┘
       │                                    │
       │ 2. 返回 OSS 签名                   │
       │◀─────────────────────────────────│
       │                                    │
       │ 3. 直传到 OSS                      │
       │ ──────────────────▶ ┌──────────┐
       │                     │  阿里云   │
       │                     │   OSS     │
       │◀────────────────────│           │
       │   4. 上传成功回调    └───────────┘
       │
       │ 5. 通知后端创建文件记录 + 转录任务
       │ ──────────────────▶ ┌──────────┐
       │                     │  后端     │
       │                     │  服务     │
       │                     │           │
       │                     │ 6. 加入   │
       │                     │    转录队列│
       │                     │           │
       │                     │ 7. 执行   │
       │                     │    转录    │
       │                     │           │
       │◀────────────────────│ 8. 通知   │
       │                     │    完成   │
       └─────────────────────┴───────────┘
```

### 具体实现步骤

#### 步骤 1: 前端上传成功后调用后端接口

```javascript
// 小程序端示例代码
Page({
  data: {
    uploading: false,
  },

  // 选择并上传文件
  async chooseAndUploadFile() {
    try {
      // 1. 选择文件
      const { tempFiles } = await wx.chooseMessageFile({
        count: 1,
        type: 'file',
      });

      const file = tempFiles[0];
      this.setData({ uploading: true });

      // 2. 获取 OSS 签名
      const signatureRes = await this.getOssSignature(file.name);

      // 3. 上传到 OSS
      await this.uploadToOss(file.path, signatureRes.formData);

      // 4. 【关键步骤】通知后端创建文件记录和转录任务
      await this.createFileAndTranscription({
        originalName: file.name,
        ossKey: signatureRes.formData.key,
        fileSize: file.size,
        mimeType: file.type,
      });

      wx.showToast({ title: '上传成功，开始转录', icon: 'success' });

    } catch (error) {
      console.error('上传失败:', error);
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      this.setData({ uploading: false });
    }
  },

  // 获取 OSS 签名
  getOssSignature(filename) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:3000/oss/signature',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        },
        data: { filename },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data.data);
          } else {
            reject(new Error(res.data.message || '获取签名失败'));
          }
        },
        fail: reject,
      });
    });
  },

  // 上传到 OSS
  uploadToOss(filePath, formData) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: 'https://your-bucket.oss-cn-hangzhou.aliyuncs.com',
        filePath,
        name: 'file',
        formData,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res);
          } else {
            reject(new Error('OSS 上传失败'));
          }
        },
        fail: reject,
      });
    });
  },

  // 【关键】创建文件记录并启动转录
  createFileAndTranscription(fileData) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:3000/files/with-transcription',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`,
          'Content-Type': 'application/json',
        },
        data: fileData,
        success: (res) => {
          if (res.statusCode === 201) {
            resolve(res.data.data);
          } else {
            reject(new Error(res.data.message || '创建转录任务失败'));
          }
        },
        fail: reject,
      });
    });
  },
});
```

#### 步骤 2: 后端新增接口 `/files/with-transcription`

```javascript
// src/routes/file.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/file');

// ... 其他路由 ...

// 新增：创建文件并启动转录
router.post('/with-transcription', fileController.createFileWithTranscription);

module.exports = router;
```

```javascript
// src/controllers/file.js
const fileService = require('../services/file');
const transcriptionService = require('../services/transcription');
const { success, errors } = require('../utils/response');
const logger = require('../utils/logger');

// ... 其他方法 ...

/**
 * 创建文件记录并启动转录
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 */
async function createFileWithTranscription(req, res) {
  try {
    const userId = req.user.id;
    const fileData = req.body;

    logger.info('创建文件记录并启动转录', { userId, fileName: fileData.originalName });

    // 1. 创建文件记录
    const file = await fileService.createFile(userId, fileData);

    // 2. 创建转录任务（异步处理）
    const transcriptionJob = await transcriptionService.createTranscriptionTask({
      audioFileId: file.id,
      userId,
      options: {
        language: 'zh', // 默认中文，可以从前端传递
        enableSummary: true,
      },
    });

    logger.info('文件创建并转录任务已启动', {
      userId,
      fileId: file.id,
      transcriptionJobId: transcriptionJob.id,
    });

    return success(res, {
      file,
      transcription: {
        id: transcriptionJob.id,
        status: transcriptionJob.status,
      },
    }, '文件上传成功，转录任务已启动', 201);

  } catch (error) {
    logger.error('创建文件并启动转录失败', error);
    return errors.internalError(res);
  }
}

module.exports = {
  // ... 其他方法 ...
  createFileWithTranscription,
};
```

```javascript
// src/services/transcription.js
const transcriptionQueue = require('../queues/transcription');
const { Transcription } = require('../models');
const logger = require('../utils/logger');

/**
 * 创建转录任务
 * @param {Object} data - 任务数据
 * @returns {Promise<Transcription>}
 */
async function createTranscriptionTask(data) {
  const { audioFileId, userId, options = {} } = data;

  // 1. 在数据库中创建转录记录
  const transcription = await Transcription.create({
    audioFileId,
    userId,
    status: 'pending',
    language: options.language || 'zh',
    retryCount: 0,
  });

  // 2. 加入 Bull 队列
  const job = await transcriptionQueue.add('transcribe', {
    transcriptionId: transcription.id,
    audioFileId,
    userId,
    options,
  }, {
    priority: options.priority || 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });

  logger.info('转录任务已创建并加入队列', {
    transcriptionId: transcription.id,
    jobId: job.id,
    audioFileId,
  });

  return transcription;
}

module.exports = {
  createTranscriptionTask,
  // ... 其他方法
};
```

## 总结

这种方案的优点：

1. **流程清晰**：前端上传成功后，主动通知后端创建文件和转录任务
2. **职责明确**：前端负责上传，后端负责处理业务逻辑
3. **可控性强**：可以灵活处理各种异常情况（上传成功但创建任务失败等）
4. **可扩展性好**：可以轻松添加更多后续处理（如发送通知、统计等）