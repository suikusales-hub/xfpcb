# XFPCB 静态网站本地副本

线上站点 `https://xfpcb.com/` 已下载到本项目的 `site` 文件夹。

## 主要目录

- `site/`: 网站本体，后续新增、修改页面主要改这里。
- `hugo-src/`: Hugo 源码，公共导航、页脚、悬浮询盘表单已经拆成 Hugo partials。
- `site/index.html`: 首页。
- `site/products/`: 产品页目录。
- `site/css/`: 样式文件。
- `site/js/`: Header、Footer、悬浮表单等组件脚本。
- `site/images/`: 图片资源。
- `tools/`: 本地工具脚本，不需要上传到 Cloudflare Pages。

## Hugo 改造状态

Hugo 结构已经建立：

- `hugo-src/data/navigation.yaml`: 统一维护导航栏和页脚链接。
- `hugo-src/layouts/partials/header.html`: 导航栏 partial。
- `hugo-src/layouts/partials/footer.html`: 页脚 partial。
- `hugo-src/layouts/partials/floating-form.html`: 悬浮询盘表单 partial。
- `hugo-src/content/`: 从当前静态页面抽取出来的页面正文。

当前终端里如果能运行 `hugo version`，可以用：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\build-hugo.ps1
```

生成结果会输出到 `site-hugo/`。

## 本地预览

当前本地预览地址：

```text
http://127.0.0.1:8788/
```

如果以后需要重新启动预览：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\serve-static.ps1 -Root .\site -Port 8788
```

## 重新同步线上站点

如果以后想重新从线上抓取一份：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\download-xfpcb.ps1 -BaseUrl https://xfpcb.com/ -OutputDir .\site -ManifestPath .\tools\download-manifest.json
```

下载清单会保存到 `tools/download-manifest.json`。

## 部署提醒

上传或部署到 Cloudflare Pages 时，使用 `site` 文件夹作为网站根目录。不要把 `tools` 文件夹作为网站内容上传。
