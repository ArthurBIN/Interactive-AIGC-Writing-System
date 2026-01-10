<template>
  <div class="UploadContainer">
    <div class="header">
      <p>请选择下方方式上传您的作文内容</p>
    </div>

    <div class="button-group">
      <div class="upload-card" @click="showTextDialog = true">
        <van-icon name="edit" class="card-icon"/>
        <span>输入文本</span>
      </div>

      <div class="upload-card" @click="showFileDialog = true">
        <van-icon name="description" class="card-icon"/>
        <span>上传文件</span>
        <em class="tip">支持 Word / PDF</em>
      </div>
    </div>

    <van-dialog v-model="showTextDialog" title="输入作文内容" show-cancel-button @confirm="handleTextSubmit">
      <div class="dialog-content">
        <van-field
            v-model="textContent"
            type="textarea"
            placeholder="请粘贴或输入作文内容..."
            maxlength="5000"
            rows="10"
            show-word-limit
            @input="cleanTextStyle"
        />
      </div>
    </van-dialog>

    <van-dialog v-model="showFileDialog" title="上传作文文件" :show-confirm-button="false" show-cancel-button>
      <div class="dialog-content file-upload-area">
        <van-uploader
            :before-read="beforeReadFile"
            :after-read="afterReadFile"
            accept=".doc,.docx,.pdf"
        >
          <van-button icon="plus" type="info">点击选择文件</van-button>
        </van-uploader>
        <p class="file-tip">仅支持 .doc, .docx, .pdf 格式</p>
      </div>
    </van-dialog>
  </div>
</template>

<script>
import {Toast} from 'vant';

export default {
  name: 'UploadPage',
  data() {
    return {
      showTextDialog: false,
      showFileDialog: false,
      textContent: '',
      fileList: []
    }
  },
  methods: {
    // 文本清洗：去除样式转为纯文本
    cleanTextStyle() {
      // 简单处理：如果是从富文本粘贴，可以过滤掉 HTML 标签
      this.textContent = this.textContent.replace(/<[^>]+>/g, "");
    },

    // 提交文本逻辑
    handleTextSubmit() {
      if (!this.textContent.trim()) {
        Toast.fail('内容不能为空');
        return;
      }
      console.log('提交的纯文本内容：', this.textContent);
      Toast.success('上传成功');
      this.textContent = '';
    },

    // 文件上传前的校验
    beforeReadFile(file) {
      const isWord = file.type === 'application/msword' ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isPDF = file.type === 'application/pdf';
      const isExt = /\.(doc|docx|pdf)$/i.test(file.name);

      if (!isWord && !isPDF && !isExt) {
        Toast.fail('只能上传 Word 或 PDF 文件');
        return false;
      }
      return true;
    },

    // 文件读取后的操作
    afterReadFile(file) {
      console.log('已获取文件对象：', file.file);
      Toast.success('文件读取成功');
      this.showFileDialog = false;
      // 这里可以执行后续上传接口逻辑
    }
  }
}
</script>

<style scoped>
.UploadContainer {

}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header p {
  font-size: 14px;
  color: #969799;
  margin: 30px 0;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 16px;
}

.upload-card {
  background: #fff;
  border-radius: 12px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.upload-card:active {
  transform: scale(0.98);
  background-color: #f2f3f5;
}

.card-icon {
  font-size: 40px;
  color: #1989fa;
  margin-bottom: 10px;
}

.upload-card span {
  font-size: 18px;
  font-weight: 500;
  color: #323233;
}

.tip {
  font-size: 12px;
  color: #c8c9cc;
  margin-top: 4px;
  font-style: normal;
}

.dialog-content {
  padding: 20px;
}

.van-cell {
  overflow-y: auto;
  line-height: 1.6;
  padding: 0 !important;
}

.file-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.file-tip {
  font-size: 12px;
  color: #969799;
  margin-top: 15px;
}
</style>