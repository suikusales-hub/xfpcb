# XFPCB 用 Hugo / 静态站维护的起步方法

## 先说结论

当前项目已经保留两套目录：

- `site/`: 当前可直接上传 Cloudflare Pages 的纯静态网站。
- `hugo-src/`: Hugo 源码目录，导航栏、页脚、悬浮询盘表单已经按 Hugo partials 改造。
- `tools/`: 本地工具脚本，不上传。

在 Hugo 彻底验证前，线上部署仍然优先使用 `site/`。等 Hugo 能正常构建并检查通过后，再切换到 Hugo 生成目录。

## Hugo 公共组件位置

导航和页脚的维护位置已经变成：

```text
C:\Users\Administrator\Documents\XFPCB\hugo-src\data\navigation.yaml
```

模板位置：

```text
C:\Users\Administrator\Documents\XFPCB\hugo-src\layouts\partials\header.html
C:\Users\Administrator\Documents\XFPCB\hugo-src\layouts\partials\footer.html
C:\Users\Administrator\Documents\XFPCB\hugo-src\layouts\partials\floating-form.html
C:\Users\Administrator\Documents\XFPCB\hugo-src\layouts\_default\baseof.html
```

以后新增导航链接，优先改 `data/navigation.yaml`，不要每个页面手动复制导航。

## Hugo 构建

当前终端里如果 `hugo version` 能正常显示，就可以运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\build-hugo.ps1
```

默认会把 Hugo 生成结果放到：

```text
C:\Users\Administrator\Documents\XFPCB\site-hugo
```

检查无误后，`site-hugo` 才适合作为 Cloudflare Pages 新的上传目录。

## 当前最快新增页面的方法

比如要新增一个产品页 `/products/rigid-flex-pcb/`：

1. 复制一个相近页面目录：

```powershell
Copy-Item -Recurse .\site\products\4-layer-pcb .\site\products\rigid-flex-pcb
```

2. 编辑新页面：

```text
C:\Users\Administrator\Documents\XFPCB\site\products\rigid-flex-pcb\index.html
```

至少改这些位置：

- `<title>`
- `<meta name="description">`
- `<meta name="keywords">`
- `<h1>`
- 页面正文
- 图片 `alt`
- 表单或 CTA 文案

3. 加入口链接：

```text
C:\Users\Administrator\Documents\XFPCB\site\js\components\header.js
```

在 Products 下拉菜单里加入：

```html
<li><a href="/products/rigid-flex-pcb/">Rigid-Flex PCB</a></li>
```

4. 更新站点地图：

```text
C:\Users\Administrator\Documents\XFPCB\site\sitemap.xml
```

加入：

```xml
<url>
  <loc>https://xfpcb.com/products/rigid-flex-pcb/</loc>
  <lastmod>2026-05-26</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.9</priority>
</url>
```

5. 本地预览：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\serve-static.ps1 -Root .\site -Port 8788
```

打开：

```text
http://127.0.0.1:8788/products/rigid-flex-pcb/
```

6. 上传 Cloudflare Pages 时，上传 `site` 文件夹。

## Hugo 目前的问题

当前终端里还不能直接调用 Hugo：

```powershell
hugo version
```

会提示找不到 `hugo` 命令。这说明 Hugo 可能没有安装到 PATH，或者安装位置不在当前终端可见范围。

先解决这个问题，再做 Hugo 迁移：

```powershell
hugo version
```

能正常显示版本号后，再开始下一步。

## 后续迁移到 Hugo 的推荐路线

不要一次性重写整个站。推荐分三步：

1. 保留 `site/` 作为线上可部署版本。
2. 新建 `hugo-src/` 作为 Hugo 源码目录。
3. 先把产品页模板化，确认输出页面和原站一致后，再逐步迁移首页、关于页、支持页等。

目标结构大致是：

```text
XFPCB/
  site/                 # 当前可部署静态站
  hugo-src/             # 未来 Hugo 源码
    hugo.yaml
    content/
      products/
    layouts/
    static/
      css/
      js/
      images/
  tools/
```

Hugo 迁移完成后，Cloudflare Pages 的上传目录可以从 `site` 改成 Hugo 生成的 `public`，或者让 Hugo 输出到一个专门的发布目录。

## 维护原则

- 内部链接继续用 `/products/example/` 这种根路径。
- 不要写 `products/example.html`。
- CSS、JS、图片继续用 `/css/...`、`/js/...`、`/images/...`。
- Web3Forms 表单继续发到 `https://api.web3forms.com/submit`。
- 新页面要加入导航或站内链接，否则搜索引擎和用户都很难发现。
