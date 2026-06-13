# Bug 修复总结

## 修复日期
2026-06-13

## 修复的问题

### 1. 背景音乐自动播放问题 ✅

**问题描述**：
- 用户设置背景音乐为"开"后，强制关闭程序
- 再次打开程序时，音乐不会自动播放
- 需要手动去系统设置重新关闭再打开背景音乐才能播放

**根本原因**：
- 程序初始化时从 localStorage 读取了 `musicOn` 状态
- 但没有根据这个状态调用 `startBackgroundMusic()`
- 导致即使设置是"开"，音乐也不会自动播放

**修复方案**：
在 `js/app.js` 初始化代码中添加状态检查：
```javascript
if (state.musicOn) {
  startBackgroundMusic();
}
```

**修复位置**：
- `js/app.js` 第8929-8931行（在 `initCloudSync()` 之后）

---

### 2. 移动端招财空间底部按钮不显示 ✅

**问题描述**：
- 在某些手机上，招财空间页面的最下方两个按钮不显示：
  - "✅ 每日 / 每周任务"
  - "🪙 做题赚心愿金币"
- 内容被裁切，无法滚动查看

**根本原因**：
- 在 `@media (max-width: 980px)` 媒体查询中
- `#petspaceView.active` 设置了 `overflow: hidden`
- 导致内容超出视口时被裁切而不是显示滚动条

**修复方案**：
修改 `css/themes.css` 中的移动端布局样式：
```css
#petspaceView.active {
  overflow: auto;  /* 从 hidden 改为 auto */
  -webkit-overflow-scrolling: touch;
}
#petspaceView.active .pet-space-layout {
  height: auto;  /* 从 100% 改为 auto */
  min-height: 100%;
  overflow: visible;  /* 从 hidden 改为 visible */
}
#petspaceView.active .pet-room-card {
  grid-template-rows: auto minmax(0, 1fr) auto auto auto auto;
  overflow: visible;  /* 从 hidden 改为 visible */
}
```

**修复位置**：
- `css/themes.css` 第7538-7551行

---

### 3. 练习做题模式底部内容被裁切 ✅

**问题描述**：
- 在移动端做题时，底部内容被裁切
- 无法滚动查看完整的答题界面
- 操作按钮、宠物陪伴区域等可能不可见

**根本原因**：
- 在 `@media (max-width: 1180px)` 媒体查询中
- `.practice-workspace > .main-stack` 设置了 `overflow: hidden`
- `.practice-card` 设置了 `overflow: hidden` 和 `height: 100%`

**修复方案**：
修改练习界面的滚动样式：
```css
.practice-workspace > .main-stack {
  overflow: auto;  /* 从 hidden 改为 auto */
  -webkit-overflow-scrolling: touch;
}
.practice-card {
  height: auto;  /* 从 100% 改为 auto */
  overflow: visible;  /* 从 hidden 改为 visible */
}
```

**修复位置**：
- `css/themes.css` 第4742-4754行

---

### 4. 闯关模式（focus-mode）底部内容被裁切 ✅

**问题描述**：
- 在闯关模式下，底部内容被裁切
- 无法滚动查看完整内容

**根本原因**：
- 在 `@media (max-width: 1180px)` 媒体查询中
- `.practice-workspace.focus-mode > .main-stack` 设置了 `overflow: hidden`

**修复方案**：
```css
.practice-workspace.focus-mode > .main-stack {
  overflow: auto;  /* 从 hidden 改为 auto */
  -webkit-overflow-scrolling: touch;
}
```

**修复位置**：
- `css/themes.css` 第5875-5880行

---

## 其他页面检查结果

已检查以下页面，确认**没有**类似的滚动问题：

### ✅ 错题本（wrongbookView）
- 第5622-5629行正确设置了 `overflow: auto`

### ✅ 学习报告（reportView）
- 第5622-5629行正确设置了 `overflow: auto`
- 第5938-5948行针对小屏幕也有正确设置

### ✅ 打印题单（printView）
- 第5622-5629行正确设置了 `overflow: auto`
- 第5934-5937行针对纸张预览区域有正确设置

### ✅ 学生信息（dataView）
- 第5834-5843行正确设置了 `overflow: auto`

---

## 修改的文件

1. `js/app.js` - 背景音乐初始化
2. `css/themes.css` - 移动端布局滚动修复
3. `android/app/src/main/assets/www/js/app.js` - 同步修改
4. `android/app/src/main/assets/www/css/themes.css` - 同步修改

---

## Git 提交记录

1. **50fdc7c** - 修复背景音乐自动播放和移动端招财空间布局问题
2. **a1d462f** - 修复练习和闯关模式的移动端滚动问题

---

## 测试建议

### 背景音乐测试
1. 打开应用，进入系统设置
2. 开启背景音乐
3. 强制关闭应用（不是正常退出）
4. 重新打开应用
5. ✅ 预期结果：背景音乐自动播放

### 移动端滚动测试
在以下设备/视口尺寸测试：
- 小屏手机（宽度 < 620px）
- 中等屏手机（宽度 621-980px）
- 平板设备（宽度 981-1180px）

测试页面：
1. **招财空间**
   - 检查能否滚动到最底部
   - 确认"每日/每周任务"和"做题赚心愿金币"按钮可见可点击

2. **练习做题模式**
   - 开始一轮练习
   - 检查能否滚动查看完整答题界面
   - 确认底部操作按钮、宠物陪伴区域都可见

3. **闯关模式**
   - 开始闯关
   - 检查能否滚动查看完整内容
   - 确认所有UI元素都可访问

---

## 技术要点

### `-webkit-overflow-scrolling: touch`
- 为 iOS 设备启用硬件加速滚动
- 提供更流畅的滚动体验
- 支持滚动惯性效果

### `overflow: auto` vs `overflow: hidden`
- `auto`：内容超出时显示滚动条
- `hidden`：内容超出时直接裁切
- 在移动端，应该让主内容区域使用 `auto` 以支持滚动

### `height: 100%` vs `height: auto`
- `100%`：强制高度等于父容器
- `auto`：根据内容自动调整高度
- 对于需要滚动的内容，应使用 `auto` 让内容自然扩展

---

## 后续注意事项

在添加新页面或修改布局时，注意：

1. **避免在内容容器上使用 `overflow: hidden`**
   - 除非明确需要裁切效果
   - 对于可能超出视口的内容，使用 `overflow: auto`

2. **移动端优先测试**
   - 在最小的视口尺寸（如 375px 宽度）测试
   - 确保所有内容都可以通过滚动访问

3. **使用合适的高度单位**
   - 避免固定高度（如 `height: 100%`）锁定容器
   - 使用 `auto` 或 `min-height` 让内容自然扩展

4. **添加 `-webkit-overflow-scrolling: touch`**
   - 为所有滚动容器添加此属性
   - 提升 iOS 设备的滚动体验
