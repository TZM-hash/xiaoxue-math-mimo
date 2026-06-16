/**
 * 喵喵数学 - 高级微交互系统
 * 包含：输入框增强、开关动画、滚动条美化、工具提示、页面转场
 */

(function() {
  'use strict';

  function effectSettingEnabled(key) {
    try {
      const saved = JSON.parse(localStorage.getItem('mathcamp-effects-settings') || '{}');
      return saved[key] !== false;
    } catch (e) {
      return true;
    }
  }

  const MicroInteractions = {
    enabled: effectSettingEnabled('microInteractions'),

    init() {
      if (!this.enabled) return;
      this.enhanceInputs();
      this.enhanceSwitches();
      this.customizeScrollbar();
      this.setupTooltips();
      this.setupPageTransitions();
      this.enhanceSelects();

      console.log('[微交互] 已启动');
    },

    /**
     * 输入框增强 - 浮动标签
     */
    enhanceInputs() {
      const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');

      inputs.forEach(input => {
        // 跳过已处理的
        if (input.dataset.enhanced) return;
        input.dataset.enhanced = 'true';

        const wrapper = document.createElement('div');
        wrapper.className = 'enhanced-input-wrapper';

        // 获取label
        const label = input.previousElementSibling?.tagName === 'LABEL'
          ? input.previousElementSibling
          : null;

        const labelText = label?.textContent || input.placeholder || '';

        // 创建浮动标签
        const floatingLabel = document.createElement('label');
        floatingLabel.className = 'floating-label';
        floatingLabel.textContent = labelText;
        floatingLabel.setAttribute('for', input.id);

        // 包装输入框
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(floatingLabel);
        wrapper.appendChild(input);
        if (label) label.remove();

        // 添加聚焦指示器
        const indicator = document.createElement('div');
        indicator.className = 'input-indicator';
        wrapper.appendChild(indicator);

        // 处理焦点
        input.addEventListener('focus', () => {
          if (!this.enabled) return;
          wrapper.classList.add('focused');
        });

        input.addEventListener('blur', () => {
          if (!this.enabled) return;
          if (!input.value) {
            wrapper.classList.remove('focused');
          }
        });

        // 检查初始值
        if (input.value) {
          wrapper.classList.add('focused');
        }

        // 输入动画
        input.addEventListener('input', () => {
          if (!this.enabled) return;
          wrapper.classList.add('typing');
          clearTimeout(input.typingTimeout);
          input.typingTimeout = setTimeout(() => {
            wrapper.classList.remove('typing');
          }, 500);
        });
      });
    },

    /**
     * 开关按钮增强
     */
    enhanceSwitches() {
      // 查找checkbox类型的输入
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');

      checkboxes.forEach(checkbox => {
        if (checkbox.dataset.enhanced) return;
        if (checkbox.closest('.effects-toggle')) return;
        checkbox.dataset.enhanced = 'true';

        // 创建自定义开关
        const switchWrapper = document.createElement('label');
        switchWrapper.className = 'custom-switch';

        const switchTrack = document.createElement('span');
        switchTrack.className = 'switch-track';

        const switchThumb = document.createElement('span');
        switchThumb.className = 'switch-thumb';
        switchTrack.appendChild(switchThumb);

        // 包装
        checkbox.parentNode.insertBefore(switchWrapper, checkbox);
        switchWrapper.appendChild(checkbox);
        switchWrapper.appendChild(switchTrack);

        // 添加波纹效果
        switchWrapper.addEventListener('click', (e) => {
          if (!this.enabled) return;
          const ripple = document.createElement('span');
          ripple.className = 'switch-ripple';
          const rect = switchTrack.getBoundingClientRect();
          ripple.style.left = (e.clientX - rect.left) + 'px';
          ripple.style.top = (e.clientY - rect.top) + 'px';
          switchTrack.appendChild(ripple);

          setTimeout(() => ripple.remove(), 600);
        });
      });
    },

    /**
     * 自定义滚动条
     */
    customizeScrollbar() {
      const style = document.createElement('style');
      style.textContent = `
        /* 自定义滚动条 */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: var(--soft);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, var(--accent), var(--accent-2));
          border-radius: 10px;
          border: 2px solid var(--soft);
          transition: all 0.3s;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, var(--accent-2), var(--accent));
          border-color: var(--surface);
          box-shadow: 0 0 10px var(--accent);
        }

        ::-webkit-scrollbar-thumb:active {
          background: var(--accent);
        }

        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: var(--accent) var(--soft);
        }
      `;
      document.head.appendChild(style);
    },

    /**
     * 工具提示系统
     */
    setupTooltips() {
      // 创建tooltip容器
      const tooltipContainer = document.createElement('div');
      tooltipContainer.id = 'tooltipContainer';
      tooltipContainer.style.cssText = `
        position: fixed;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        border-radius: 8px;
        font-size: 13px;
        pointer-events: none;
        z-index: 10001;
        opacity: 0;
        transform: translateY(5px);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      `;
      document.body.appendChild(tooltipContainer);

      // 监听所有带title或data-tooltip的元素
      document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[title], [data-tooltip]');
        if (!target) return;

        const text = target.dataset.tooltip || target.title;
        if (!text) return;

        // 清除原生title避免冲突
        if (target.title) {
          target.dataset.tooltip = target.title;
          target.title = '';
        }

        this.showTooltip(text, e.clientX, e.clientY);

        // 跟随鼠标
        const moveHandler = (e) => {
          this.updateTooltipPosition(e.clientX, e.clientY);
        };

        target.addEventListener('mousemove', moveHandler);

        target.addEventListener('mouseout', () => {
          this.hideTooltip();
          target.removeEventListener('mousemove', moveHandler);
        }, { once: true });
      });
    },

    showTooltip(text, x, y) {
      const tooltip = document.getElementById('tooltipContainer');
      tooltip.textContent = text;
      this.updateTooltipPosition(x, y);
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
    },

    updateTooltipPosition(x, y) {
      const tooltip = document.getElementById('tooltipContainer');
      const offset = 15;

      let left = x + offset;
      let top = y + offset;

      // 防止溢出屏幕
      const rect = tooltip.getBoundingClientRect();
      if (left + rect.width > window.innerWidth) {
        left = x - rect.width - offset;
      }
      if (top + rect.height > window.innerHeight) {
        top = y - rect.height - offset;
      }

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    },

    hideTooltip() {
      const tooltip = document.getElementById('tooltipContainer');
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(5px)';
    },

    /**
     * 页面视图切换动画
     */
    setupPageTransitions() {
      // 监听视图切换
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const target = mutation.target;
            if (target.classList.contains('view') && target.classList.contains('active')) {
              this.transitionToView(target);
            }
          }
        });
      });

      document.querySelectorAll('.view').forEach(view => {
        observer.observe(view, { attributes: true });
      });
    },

    transitionToView(view) {
      if (!this.enabled) return;
      // 添加进入动画
      view.style.animation = 'viewSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';

      setTimeout(() => {
        view.style.animation = '';
      }, 500);
    },

    /**
     * 下拉框增强
     */
    enhanceSelects() {
      const selects = document.querySelectorAll('select');

      selects.forEach(select => {
        if (select.dataset.enhanced) return;
        select.dataset.enhanced = 'true';

        // 添加选中动画
        select.addEventListener('change', () => {
          if (!this.enabled) return;
          select.style.animation = 'selectPulse 0.3s ease';
          setTimeout(() => {
            select.style.animation = '';
          }, 300);
        });

        // 添加聚焦指示
        select.addEventListener('focus', () => {
          if (!this.enabled) return;
          select.style.transform = 'scale(1.02)';
          select.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
        });

        select.addEventListener('blur', () => {
          if (!this.enabled) return;
          select.style.transform = 'scale(1)';
          select.style.boxShadow = '';
        });
      });
    },

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
    }
  };

  // 添加CSS样式
  const style = document.createElement('style');
  style.textContent = `
    /* 增强输入框 */
    .enhanced-input-wrapper {
      position: relative;
      margin: 16px 0;
    }

    .enhanced-input-wrapper input,
    .enhanced-input-wrapper textarea {
      width: 100%;
      padding: 12px 12px 12px 12px;
      border: 2px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .floating-label {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted);
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      background: var(--surface);
      padding: 0 4px;
      font-size: 14px;
    }

    .enhanced-input-wrapper.focused .floating-label {
      top: 0;
      font-size: 12px;
      color: var(--accent);
    }

    .enhanced-input-wrapper.focused input,
    .enhanced-input-wrapper.focused textarea {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent), transparent 85%);
    }

    .input-indicator {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      width: 0;
      background: var(--accent);
      transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .enhanced-input-wrapper.focused .input-indicator {
      width: 100%;
    }

    .enhanced-input-wrapper.typing input {
      animation: inputTyping 0.3s ease;
    }

    @keyframes inputTyping {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.01); }
    }

    /* 自定义开关 */
    .custom-switch {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      position: relative;
    }

    .custom-switch input[type="checkbox"] {
      display: none;
    }

    .switch-track {
      width: 48px;
      height: 24px;
      background: var(--border);
      border-radius: 12px;
      position: relative;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
    }

    .switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .custom-switch input:checked + .switch-track {
      background: var(--accent);
    }

    .custom-switch input:checked + .switch-track .switch-thumb {
      left: 26px;
    }

    .switch-ripple {
      position: absolute;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      width: 10px;
      height: 10px;
      animation: switchRipple 0.6s ease-out;
      pointer-events: none;
    }

    @keyframes switchRipple {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(6);
        opacity: 0;
      }
    }

    /* 视图切换动画 */
    @keyframes viewSlideIn {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* 下拉框脉冲 */
    @keyframes selectPulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.02);
      }
    }

    /* 平滑过渡 */
    input, select, textarea, button {
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }
  `;
  document.head.appendChild(style);

  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => MicroInteractions.init(), 600);
    });
  } else {
    setTimeout(() => MicroInteractions.init(), 600);
  }

  // 导出到全局
  window.MathCampMicroInteractions = MicroInteractions;

})();
