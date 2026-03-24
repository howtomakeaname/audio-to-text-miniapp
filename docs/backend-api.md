# API 接口设计文档

## 接口规范

- **基础URL**: `${BASE_URL}`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: Bearer Token (JWT)
- **时间格式**: ISO 8601 (示例: `2024-01-15T10:30:00Z`)

## 通用响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 错误响应

```json
{
  "code": 10001,
  "message": "error description",
  "data": null
}
```

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，Token无效或过期 |
| 403 | 禁止访问，权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 10001 | 通用错误 |
| 10002 | 参数错误 |
| 10003 | 资源不存在 |
| 10101 | 微信登录失败 |
| 10102 | Token无效或过期 |
| 10201 | OSS签名生成失败 |
| 10301 | 文件不存在或无权限 |
| 10401 | 转录任务创建失败 |
| 10402 | 转录任务不存在 |

---

## 接口列表

### 1. 认证相关接口

#### 1.1 微信小程序登录

**接口**: `POST /auth/login`

**描述**: 使用微信 code 换取用户身份，返回 JWT Token

**请求头**:
```
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 微信登录凭证 |
| userInfo | object | 否 | 用户信息(加密) |

**请求示例**:
```json
{
  "code": "043c1y0w3C8Rz03H1B0w3g1q2d0c1y0w"
}
```

**响应参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| token | string | JWT Token |
| expiresIn | number | Token有效期(秒) |
| user | object | 用户信息 |

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800,
    "user": {
      "id": 1,
      "openid": "o1Y2s5t7u9w2y4A6C8E0G2I4K6M8O0Q2",
      "nickname": "微信用户",
      "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/vi_32/..."
    }
  }
}
```

**错误响应**:
```json
{
  "code": 10101,
  "message": "微信登录失败: invalid code",
  "data": null
}
```

---

#### 1.2 刷新 Token

**接口**: `POST /auth/refresh`

**描述**: 刷新 JWT Token

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**: 无

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

---

#### 1.3 获取当前用户信息

**接口**: `GET /auth/me`

**描述**: 获取当前登录用户信息

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "openid": "o1Y2s5t7u9w2y4A6C8E0G2I4K6M8O0Q2",
    "nickname": "微信用户",
    "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/vi_32/...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. OSS 签名相关接口

#### 2.1 获取 OSS 直传签名

**接口**: `POST /oss/signature`

**描述**: 获取阿里云 OSS 直传所需的签名参数

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filename | string | 是 | 原始文件名(用于生成OSS key) |
| contentType | string | 否 | 文件MIME类型 |

**请求示例**:
```json
{
  "filename": "meeting-recording.mp3",
  "contentType": "audio/mpeg"
}
```

**响应参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| ossEndpoint | string | OSS Endpoint URL |
| ossBucket | string | Bucket 名称 |
| formData | object | 表单上传所需的参数 |

**formData 结构**:

| 参数 | 类型 | 说明 |
|------|------|------|
| key | string | OSS 对象键名(包含路径) |
| policy | string | 表单策略(Base64编码) |
| x-oss-signature-version | string | 签名版本(固定值: OSS4-HMAC-SHA256) |
| x-oss-credential | string | 签名凭证 |
| x-oss-date | string | 签名时间戳(ISO8601格式) |
| x-oss-signature | string | 计算后的签名值 |
| x-oss-security-token | string | STS临时凭证Token(使用STS时必填) |
| success_action_status | string | 成功上传返回的HTTP状态码(建议: 200) |

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "ossEndpoint": "https://mybucket.oss-cn-hangzhou.aliyuncs.com",
    "ossBucket": "mybucket",
    "formData": {
      "key": "uploads/2024/01/15/user_123/meeting-recording-1705312200000.mp3",
      "policy": "eyJleHBpcmF0aW9uIjoiMjAyNC0wMS0xNVQxMDozMDowMFoiL...",
      "x-oss-signature-version": "OSS4-HMAC-SHA256",
      "x-oss-credential": "LTAI5t8Z3y8Y7Z7Z7Z7Z7Z7Z/20240115/cn-hangzhou/oss/aliyun_v4_request",
      "x-oss-date": "20240115T102000Z",
      "x-oss-signature": "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7",
      "x-oss-security-token": "CAIS+AF1q6Ft5B2yfSjIr5bWEf...",
      "success_action_status": "200"
    }
  }
}
```

**错误响应**:
```json
{
  "code": 10201,
  "message": "OSS签名生成失败: STS token获取失败",
  "data": null
}
```

---

### 3. 文件管理接口

#### 3.1 获取文件列表

**接口**: `GET /files`

**描述**: 获取当前用户的音频文件列表

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20，最大 100 |
| status | string | 否 | 状态筛选：active/deleted，默认 active |

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "originalName": "meeting-recording.mp3",
        "fileSize": 5242880,
        "duration": 300,
        "ossUrl": "https://mybucket.oss-cn-hangzhou.aliyuncs.com/uploads/...",
        "status": "active",
        "transcriptionStatus": "completed",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:35:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1,
      "hasMore": false
    }
  }
}
```

---

#### 3.2 获取文件详情

**接口**: `GET /files/:id`

**描述**: 获取指定音频文件的详细信息，包含转录结果

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 文件ID |

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "originalName": "meeting-recording.mp3",
    "fileSize": 5242880,
    "duration": 300,
    "mimeType": "audio/mpeg",
    "ossUrl": "https://mybucket.oss-cn-hangzhou.aliyuncs.com/uploads/...",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z",
    "transcription": {
      "id": 1,
      "status": "completed",
      "transcriptText": "今天的会议主要讨论了Q1的产品规划...",
      "summaryText": "本次会议确定了Q1的产品路线图，重点包括...",
      "language": "zh",
      "processingTime": 45000,
      "createdAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

**错误响应**:
```json
{
  "code": 10301,
  "message": "文件不存在或无权限访问",
  "data": null
}
```

---

#### 3.3 删除文件

**接口**: `DELETE /files/:id`

**描述**: 删除指定音频文件（软删除，标记为 deleted 状态）

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 文件ID |

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "deleted": true,
    "deletedAt": "2024-01-15T10:40:00Z"
  }
}
```

---

### 4. 转录任务接口

#### 4.1 创建转录任务

**接口**: `POST /transcriptions`

**描述**: 为已上传的音频文件创建转录任务

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| audioFileId | number | 是 | 音频文件ID |
| options | object | 否 | 转录选项 |

**options 结构**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| language | string | 否 | 指定语言，如: zh, en，自动检测则不传 |
| prompt | string | 否 | 提示词，帮助提高转录准确性 |
| enableSummary | boolean | 否 | 是否生成摘要，默认 true |

**请求示例**:
```json
{
  "audioFileId": 1,
  "options": {
    "language": "zh",
    "prompt": "这是一段会议录音",
    "enableSummary": true
  }
}
```

**响应参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 转录任务ID |
| audioFileId | number | 音频文件ID |
| status | string | 任务状态: pending |
| createdAt | string | 创建时间 |
| estimatedTime | number | 预估处理时间(秒) |

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "audioFileId": 1,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z",
    "estimatedTime": 60
  }
}
```

**错误响应**:
```json
{
  "code": 10401,
  "message": "转录任务创建失败: 该文件已存在转录任务",
  "data": null
}
```

---

#### 4.2 查询转录任务状态

**接口**: `GET /transcriptions/:id`

**描述**: 查询指定转录任务的详细信息和结果

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 转录任务ID |

**响应示例 - 处理中**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "audioFileId": 1,
    "status": "processing",
    "progress": 45,
    "currentStep": "transcribing",
    "createdAt": "2024-01-15T10:30:00Z",
    "startedAt": "2024-01-15T10:30:05Z"
  }
}
```

**响应示例 - 已完成**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "audioFileId": 1,
    "status": "completed",
    "transcriptText": "今天的会议主要讨论了Q1的产品规划。首先，产品经理介绍了当前的市场情况...",
    "summaryText": "本次会议确定了Q1的产品路线图，重点包括：1. 核心功能优化 2. 新模块开发 3. 性能提升计划",
    "language": "zh",
    "processingTime": 45000,
    "createdAt": "2024-01-15T10:30:00Z",
    "startedAt": "2024-01-15T10:30:05Z",
    "completedAt": "2024-01-15T10:30:50Z"
  }
}
```

**响应示例 - 失败**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "audioFileId": 1,
    "status": "failed",
    "errorMessage": "SiliconFlow API调用失败: 音频文件格式不支持",
    "retryCount": 2,
    "createdAt": "2024-01-15T10:30:00Z",
    "startedAt": "2024-01-15T10:30:05Z"
  }
}
```

**错误响应**:
```json
{
  "code": 10402,
  "message": "转录任务不存在或无权限访问",
  "data": null
}
```

---

#### 4.3 重新执行转录任务

**接口**: `POST /transcriptions/:id/retry`

**描述**: 对失败的转录任务进行重试

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 转录任务ID |

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| options | object | 否 | 新的转录选项（覆盖原选项） |

**请求示例**:
```json
{
  "options": {
    "language": "zh",
    "enableSummary": true
  }
}
```

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "audioFileId": 1,
    "status": "pending",
    "retryCount": 1,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:45:00Z"
  }
}
```

---

## 接口调用流程示例

### 完整的上传和处理流程

```javascript
// 1. 微信登录获取 Token
const loginRes = await wx.login();
const authRes = await request('/auth/login', {
  method: 'POST',
  data: { code: loginRes.code }
});
const token = authRes.data.token;

// 2. 选择文件
const fileRes = await wx.chooseMessageFile({ count: 1, type: 'file' });
const file = fileRes.tempFiles[0];

// 3. 获取 OSS 签名
const signRes = await request('/oss/signature', {
  method: 'POST',
  header: { Authorization: `Bearer ${token}` },
  data: { 
    filename: file.name,
    contentType: file.type
  }
});

// 4. 直传文件到 OSS
await wx.uploadFile({
  url: signRes.data.ossEndpoint,
  filePath: file.path,
  name: 'file',
  formData: signRes.data.formData
});

// 5. 创建转录任务
const taskRes = await request('/transcriptions', {
  method: 'POST',
  header: { Authorization: `Bearer ${token}` },
  data: { 
    audioFileId: signRes.data.fileId,
    options: { enableSummary: true }
  }
});

// 6. 轮询查询任务状态
const taskId = taskRes.data.id;
const pollTask = async () => {
  const res = await request(`/transcriptions/${taskId}`, {
    header: { Authorization: `Bearer ${token}` }
  });
  if (res.data.status === 'completed') {
    console.log('转录完成:', res.data.transcriptText);
    console.log('摘要:', res.data.summaryText);
  } else if (res.data.status === 'failed') {
    console.error('转录失败:', res.data.errorMessage);
  } else {
    setTimeout(pollTask, 3000); // 3秒后重试
  }
};
pollTask();
```

---

## WebSocket 实时推送 (可选扩展)

考虑到小程序对 WebSocket 的支持以及实时性需求，可以添加 WebSocket 接口用于实时推送任务状态变更。

### 连接地址

```
wss://api.example.com/v1/ws?token={jwt_token}
```

### 消息格式

**服务端推送 - 任务状态更新**:
```json
{
  "type": "transcription_update",
  "data": {
    "taskId": 1,
    "status": "processing",
    "progress": 45,
    "message": "正在转录音频..."
  }
}
```

**服务端推送 - 任务完成**:
```json
{
  "type": "transcription_completed",
  "data": {
    "taskId": 1,
    "status": "completed",
    "transcriptText": "...",
    "summaryText": "..."
  }
}
```
