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

    <van-dialog
        v-model="showTextDialog"
        title="填写作文"
        show-cancel-button
        :before-close="onBeforeCloseText"
    >
      <div class="dialog-content">
        <van-field
            v-model="compositionTitle"
            label="标题"
            placeholder="请输入作文标题 (可选)"
            maxlength="50"
            clearable
            class="title-input"
        />
        <van-field
            v-model="textContent"
            type="textarea"
            placeholder="请粘贴或输入作文内容..."
            maxlength="5000"
            rows="8"
            show-word-limit
            @input="cleanTextStyle"
            class="content-input"
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
import mammoth from 'mammoth';

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
// 设置 Worker 路径 (使用静态资源库的 CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

export default {
  name: 'UploadPage',
  data() {
    return {
      showTextDialog: false,
      showFileDialog: false,
      compositionTitle: '', // 作文标题
      textContent: '',      // 作文内容
      fileList: []
    }
  },
  methods: {
    // 文本清洗：去除样式转为纯文本
    cleanTextStyle() {
      this.textContent = this.textContent.replace(/<[^>]+>/g, "");
    },

    // 对话框关闭前校验
    onBeforeCloseText(action, done) {
      if (action === 'confirm') {
        if (!this.textContent.trim()) {
          Toast.fail('内容不能为空');
          done(false);
        } else {
          const compositionData = {
            title: this.compositionTitle || '无标题',
            content: this.textContent,
          };
          localStorage.setItem('temp_composition_data', JSON.stringify(compositionData));
          this.$router.push('/analysis');
          Toast.success('提交成功，开始分析');
          this.resetData();
          done();
        }
      } else {
        // 点击取消按钮
        this.resetData();
        done();
      }
    },

    // 重置输入数据
    resetData() {
      this.textContent = '';
      this.compositionTitle = '';
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

    // 解析文件逻辑
    async afterReadFile(file) {
      const originFile = file.file;
      const fileName = originFile.name;

      Toast.loading({message: '正在解析...', forbidClick: true, duration: 0});

      try {
        let extractedText = "";
        if (fileName.toLowerCase().endsWith('.docx')) {
          extractedText = await this.parseDocx(originFile);
        } else if (fileName.toLowerCase().endsWith('.pdf')) {
          extractedText = await this.parsePdf(originFile);
        } else {
          Toast.fail('格式不支持');
          return;
        }

        // 1. 设置内容
        this.textContent = this.cleanExtractedText(extractedText);

        // 2. 提取文件名作为标题（去掉后缀名）
        this.compositionTitle = fileName.substring(0, fileName.lastIndexOf('.'));

        Toast.clear();
        this.showFileDialog = false;
        // 3. 解析完成后自动打开文本编辑框，方便用户查看和修改标题/内容
        this.showTextDialog = true;
        Toast.success('解析成功');
      } catch (error) {
        console.error('解析失败:', error);
        Toast.fail('文件损坏或格式错误');
      }
    },

    // 解析 DOCX
    async parseDocx(file) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({arrayBuffer});
      return result.value;
    },

    // 解析 PDF
    async parsePdf(file) {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
      const pdf = await loadingTask.promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join('');
        fullText += pageText + "\n";
      }
      return fullText;
    },

    // 清洗解析出的文本
    cleanExtractedText(text) {
      return text
          .replace(/\t/g, ' ')
          .trim();
    }
  }
}
</script>

<style scoped>
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
  padding: 10px 20px 20px;
}

/* 标题输入框样式微调 */
.title-input {
  margin-bottom: 10px;
  border-bottom: 1px solid #f2f3f5;
}

/* 正文输入框样式微调 */
.content-input {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 0 !important;
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