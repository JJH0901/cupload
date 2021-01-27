import React, { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Icon, message } from 'antd';
import Upload, { RcFile } from 'antd/lib/upload';
import lrz from 'lrz';
import { UploadProps, UploadFile } from 'antd/lib/upload/interface';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

interface CuploadPros extends UploadProps {
  max?: number;
  previewZIndex?: number;
  callBack?: Function;
  children?: any;
  useCompress: boolean;
  compressSize: number;
  rate: number;
  limitWidth?: number;
  limitHeight?: number;
}

function Cupload(props: CuploadPros) {
  const { max, previewZIndex = 2001, callBack, beforeUpload, onChange, useCompress = false, compressSize = 3, rate = 0.7, limitWidth, limitHeight, defaultFileList = [], children } = props;
  const [uploadFileList, setUploadFileList] = useState(defaultFileList);
  const [showUploadBtn, setShowUploadBtn] = useState(true);
  const [previewImage, setPreviewImage] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  // useEffect(() => {
  //   setUploadFileList(defaultFileList);
  // }, [defaultFileList]);

  const getBase64 = (file: RcFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handlePreview = async (file: any) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
  };

  const handleRemove = (file: UploadFile) => {
    const validFiles = uploadFileList;
    for (let i = 0; i < validFiles.length; i++) {
      if (validFiles[i].uid === file.uid) {
        validFiles.splice(i, 1);
        break;
      }
    }
    setUploadFileList(validFiles);
    if (validFiles.length === 0) {
      setShowUploadBtn(true);
    }
    callBack && callBack(validFiles);
  }

  const [showErr] = useDebouncedCallback((msg) => {
    message.error(msg);
  }, 1000);

  const handleChange = (data: any) => {
    const { file, fileList } = data;
    if (file.status === 'done') {
      const { code, message: msg } = file.response;
      if (code === '7000') {
        message.error(msg);
        const validFiles = [];
        for (let i = 0; i < fileList.length; i++) {
          if (fileList[i].uid !== file.uid) {
            validFiles.push(fileList[i]);
          }
        }
        setUploadFileList(validFiles);
        if (max && validFiles.length < max) {
          setShowUploadBtn(true);
        }
        callBack && callBack(validFiles);
        return;
      }
      callBack && callBack(fileList);
    }

    if (max && fileList.length > max) {
      showErr(`最多上传${max}张图片！`);
      return false;
    }

    if (max && fileList.length >= max) {
      setShowUploadBtn(false);
      if (fileList.length === max) {
        setUploadFileList([...fileList]);
      }
    } else {
      setShowUploadBtn(true);
      setUploadFileList([...fileList]);
    }

    onChange && onChange(data);
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    // 转换成file对象
    return new File([u8arr], filename, { type: mime });
    // 转换成成blob对象
    // return new Blob([u8arr],{type:mime});
  }

  const backPromise = (res) => {
    return new Promise((resolve, reject) => {
      if (res instanceof Object) {
        // 将压缩后的base64字符串转换为文件对象
        const file = dataURLtoFile(res.base64, res.origin.name);

        // 需要给文件对象一个唯一的uid属性否则将会报错
        Object.assign(file, { uid: file.lastModified });
        resolve(file);
      } else {
        reject(new Error('压缩失败'))
      }
    })

  }

  const compress = (file: any) => {
    // 压缩一兆以上图片
    if (file.size > compressSize * 1024 * 1024) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const img = new Image();
      reader.onload = function (e) {
        img.src = e.target && e.target.result || '';
      };
      return lrz(file, { quality: rate }).then((rst) => {// 数字越小，压缩率越高
        return backPromise(rst);
      })
        .catch(() => {
          console.log('压缩失败');
          return false
        })
    }
    return true;
  }

  const beforeUploadMethod = (file: RcFile, fileList: RcFile[]) => {
    const totalCount = fileList.length + uploadFileList.length;
    if (max && totalCount > max) {
      return false;
    }

    // 限制图片宽高
    if (limitWidth || limitHeight) {
      let resolvePromise: Function;
      let rejectPromise: Function;
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      /* eslint-disable-next-line */
      img.onload = function () {
        /* eslint-disable-next-line */
        if ((limitWidth ? this.width === limitWidth : true) && (limitHeight ? this.height === limitHeight : true)) {
          return resolvePromise(true);
        }
        message.error(`图片尺寸必须是${limitWidth || 'n'}*${limitHeight || 'n'}`);
        rejectPromise(false);
      };
      img.src = objectUrl;
      return new Promise((resolve, reject) => {
        resolvePromise = resolve;
        rejectPromise = reject;
      })
    }

    beforeUpload && beforeUpload(file, fileList);

    return useCompress ? compress(file) : true;
  };

  const uploadProps: UploadProps = {
    accept: '.png, .jpg, .jpeg',
    action: '',
    listType: 'picture-card',
    onPreview: handlePreview,
    onRemove: handleRemove,
    onChange: handleChange,
    beforeUpload: beforeUploadMethod,
    ...props,
    data: { 'check': true, ...props.data },
    fileList: uploadFileList,
  };

  return (
    <>
      <Upload
        {...uploadProps}
      >
        {showUploadBtn && (!max || (max && uploadFileList.length < max)) ? (children || <Icon type="plus" />) : null}
      </Upload>
      {previewVisible && (
        <Lightbox
          mainSrc={previewImage}
          onCloseRequest={() => { setPreviewVisible(false); setPreviewImage(''); }}
          animationDisabled
          reactModalStyle={{ overlay: { zIndex: previewZIndex } }}
        />
      )}
    </>
  );
}

export default Cupload;