/**
 * 计时器闪烁BUG修复补丁
 * 问题：多个定时器同时更新造成视觉闪烁
 * 解决：使用requestAnimationFrame + 防抖优化
 */

(function() {
  'use strict';

  // 等待app.js加载完成
  window.addEventListener('load', function() {
    console.log('[计时器修复] 开始修复闪烁问题...');

    // 查找计时器元素
    const timerElement = document.getElementById('timerStat');
    if (!timerElement) {
      console.warn('[计时器修复] 未找到计时器元素');
      return;
    }

    // 创建防抖缓存
    let lastUpdateTime = 0;
    let lastDisplayedValue = '';
    let rafId = null;

    // 使用MutationObserver监听计时器更新
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const newValue = timerElement.textContent;

          // 防止相同值重复更新（主要原因）
          if (newValue === lastDisplayedValue) {
            return;
          }

          // 使用requestAnimationFrame优化更新时机
          if (rafId) {
            cancelAnimationFrame(rafId);
          }

          rafId = requestAnimationFrame(function() {
            const now = Date.now();

            // 防抖：至少间隔100ms
            if (now - lastUpdateTime < 100) {
              return;
            }

            lastUpdateTime = now;
            lastDisplayedValue = newValue;

            // 添加平滑过渡
            timerElement.style.transition = 'opacity 0.15s ease';
            rafId = null;
          });
        }
      });
    });

    // 开始观察
    observer.observe(timerElement, {
      childList: true,
      characterData: true,
      subtree: true
    });

    // 添加CSS平滑过渡
    const style = document.createElement('style');
    style.textContent = `
      #timerStat {
        transition: opacity 0.15s ease !important;
        will-change: contents;
      }
    `;
    document.head.appendChild(style);

    console.log('[计时器修复] 修复完成！');
  });

})();
