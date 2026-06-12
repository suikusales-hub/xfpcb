/**
 * js/main.js
 * 
 * 解耦原理（原生 JavaScript 模块化）�? * 这是一个模块入口文件。通过原生 ES6 import 语法引入独立�?Web Components�? * 在纯静态网站中，无需打包工具（Webpack/Vite）或框架（React/Vue），
 * 只要�?index.html 中声�?<script type="module" src="..."> 即可自动解析依赖并注册组件�? */

import './components/header.js?v=20260602-layer-pages';
import './components/footer.js?v=20260602-layer-pages';
import './components/floating-form.js?v=20260602-layer-pages'; // 引入悬浮表单组件
