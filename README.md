###此插件旨在构建ToC端上传组件，支持上传前压缩图片，支持图片鉴黄、涉政、涉暴验证功能，违禁图片禁止上传，后期会丰富上传后的UI，支持物料UI库，可自行配置添加物料

###使用方式

####1、安装npm包

npm install cupload --save-dev

或

yarn add cupload

####2、引入包

import Cupload from 'cupload';



###参数

max: number // 最大允许上传图片张数

previewZIndex: number // 图片预览时的层级

callBack: Function(files: UploadFile[]) //上传后的回调函数，返回上传图片列表

其余参数可参考antd upload文档：https://3x.ant.design/components/upload-cn/

####cupload内置了以下参数，可通对Cupload组件传入相应参数进行覆盖，当全覆盖时，cupload等同于antd upload

accept: '.png, .jpg, .jpeg',

listType: 'picture-card',

beforeUpload: beforeUploadMethod,

onPreview: handlePreview,

onChange: handleChange,

useCompress: false, // 是否启用压缩，默认false--不启用

compressSize: 3, // 默认超过3M，且启用压缩时会触发压缩，可传入自定义值

rate: 0.7, // 默认0.7，可传入自定义值

limitWidth: number, // 限制图片宽度，默认不限制

limitHeight: number, // 限制图片高度，默认不限制

data: { 'check': true }, // check参数为是否开启鉴黄、涉政、涉暴等验证，默认true开启，会与传入的data参数合并


###注：图片校验不合规，会自动删除，不会保留
