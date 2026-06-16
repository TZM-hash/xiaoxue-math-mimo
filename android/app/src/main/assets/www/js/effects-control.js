/**
 * 喵喵数学 - 特效控制面板
 * 提供UI控制所有美化效果的开关
 */

(function() {
  'use strict';

  const EffectsControl = {
    settings: {
      cursorEffects: true,
      seasonEffects: true,
      themeBackgrounds: true,
      catInteraction: true,
      questionEnhancements: true,
      microInteractions: true
    },

    init() {
      this.loadSettings();
      this.createControlPanel();

      console.log('[特效控制] 已启动');
    },

    /**
     * 加载保存的设置
     */
    loadSettings() {
      try {
        const saved = localStorage.getItem('mathcamp-effects-settings');
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.warn('[特效控制] 加载设置失败', e);
      }

      // 应用设置
      this.applySettings();
    },

    /**
     * 保存设置
     */
    saveSettings() {
      try {
        localStorage.setItem('mathcamp-effects-settings', JSON.stringify(this.settings));
        window.MathCampSystemSettings?.markUpdated?.();
      } catch (e) {
        console.warn('[特效控制] 保存设置失败', e);
      }
    },

    /**
     * 应用设置
     */
    applySettings() {
      if (!this.settings.cursorEffects && window.MathCampCursorEffects) {
        window.MathCampCursorEffects.disable();
      }

      if (!this.settings.seasonEffects && window.MathCampSeasonEffects) {
        window.MathCampSeasonEffects.stopEffect();
      }

      if (!this.settings.themeBackgrounds && window.MathCampThemeBackgrounds) {
        window.MathCampThemeBackgrounds.clearBackground();
      }
    },

    /**
     * 创建控制面板
     */
    createControlPanel() {
      const panel = document.createElement('div');
      panel.id = 'effectsControlPanel';
      panel.innerHTML = `
        <div class="control-panel-header">
          <span>✨ 特效控制</span>
          <button class="panel-toggle" type="button" aria-label="收起面板">−</button>
        </div>
        <div class="control-panel-body">
          <div class="control-item">
            <label>
              <input type="checkbox" data-setting="cursorEffects" ${this.settings.cursorEffects ? 'checked' : ''}>
              <span>光标特效</span>
            </label>
            <small>粒子尾迹、点击爆炸、磁吸效果</small>
          </div>

          <div class="control-item">
            <label>
              <input type="checkbox" data-setting="seasonEffects" ${this.settings.seasonEffects ? 'checked' : ''}>
              <span>季节效果</span>
            </label>
            <small>樱花、雪花、落叶等</small>
          </div>

          <div class="control-item">
            <label>
              <input type="checkbox" data-setting="themeBackgrounds" ${this.settings.themeBackgrounds ? 'checked' : ''}>
              <span>主题背景</span>
            </label>
            <small>星空、森林等动态背景</small>
          </div>

          <div class="control-item">
            <label>
              <input type="checkbox" data-setting="catInteraction" ${this.settings.catInteraction ? 'checked' : ''}>
              <span>招财猫互动</span>
            </label>
            <small>点击动作、心情反馈、气泡</small>
          </div>

          <div class="control-item">
            <label>
              <input type="checkbox" data-setting="questionEnhancements" ${this.settings.questionEnhancements ? 'checked' : ''}>
              <span>答题增强</span>
            </label>
            <small>聚焦模式、连对特效、通关动画</small>
          </div>

          <div class="control-item">
            <label>
              <input type="checkbox" data-setting="microInteractions" ${this.settings.microInteractions ? 'checked' : ''}>
              <span>微交互</span>
            </label>
            <small>输入框、开关、提示等细节动画</small>
          </div>

          <div class="control-actions">
            <button class="secondary small" type="button" id="resetEffects">恢复默认</button>
            <button class="secondary small" type="button" id="reloadPage">刷新应用</button>
          </div>
        </div>
      `;

      panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: var(--surface);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-family: var(--font-body);
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      `;

      document.body.appendChild(panel);

      // 绑定事件
      this.bindPanelEvents(panel);
    },

    /**
     * 绑定面板事件
     */
    bindPanelEvents(panel) {
      // 收起/展开
      const toggle = panel.querySelector('.panel-toggle');
      const body = panel.querySelector('.control-panel-body');

      toggle.addEventListener('click', () => {
        if (body.style.display === 'none') {
          body.style.display = 'block';
          toggle.textContent = '−';
          panel.style.height = 'auto';
        } else {
          body.style.display = 'none';
          toggle.textContent = '+';
          panel.style.height = '48px';
        }
      });

      // 设置开关
      panel.querySelectorAll('[data-setting]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const setting = e.target.dataset.setting;
          this.settings[setting] = e.target.checked;
          this.saveSettings();
          this.toggleEffect(setting, e.target.checked);
        });
      });

      // 恢复默认
      panel.querySelector('#resetEffects').addEventListener('click', () => {
        this.settings = {
          cursorEffects: true,
          seasonEffects: true,
          themeBackgrounds: true,
          catInteraction: true,
          questionEnhancements: true,
          microInteractions: true
        };
        this.saveSettings();

        // 更新复选框状态
        panel.querySelectorAll('[data-setting]').forEach(checkbox => {
          checkbox.checked = true;
        });

        // 提示
        if (window.MathCampUIFeedback) {
          window.MathCampUIFeedback.notify('已恢复默认设置，刷新页面生效');
        }
      });

      // 刷新页面
      panel.querySelector('#reloadPage').addEventListener('click', () => {
        location.reload();
      });
    },

    /**
     * 切换特效
     */
    toggleEffect(name, enabled) {
      switch(name) {
        case 'cursorEffects':
          if (window.MathCampCursorEffects) {
            if (enabled) {
              window.MathCampCursorEffects.init();
            } else {
              window.MathCampCursorEffects.disable();
            }
          }
          break;

        case 'seasonEffects':
          if (window.MathCampSeasonEffects) {
            if (enabled) {
              window.MathCampSeasonEffects.autoSelectSeason();
            } else {
              window.MathCampSeasonEffects.stopEffect();
            }
          }
          break;

        case 'themeBackgrounds':
          if (window.MathCampThemeBackgrounds) {
            if (enabled) {
              window.MathCampThemeBackgrounds.detectTheme();
            } else {
              window.MathCampThemeBackgrounds.clearBackground();
            }
          }
          break;

        default:
          // 其他效果需要刷新页面
          if (window.MathCampUIFeedback) {
            window.MathCampUIFeedback.notify('刷新页面后生效');
          }
          break;
      }
    }
  };

  // 添加CSS样式
  const style = document.createElement('style');
  style.textContent = `
    #effectsControlPanel {
      font-size: 14px;
    }

    .control-panel-header {
      padding: 12px 16px;
      background: linear-gradient(135deg, var(--accent), var(--accent-2));
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
      cursor: move;
      user-select: none;
    }

    .panel-toggle {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      line-height: 1;
      transition: all 0.2s;
    }

    .panel-toggle:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    .control-panel-body {
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;
    }

    .control-item {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }

    .control-item:last-of-type {
      border-bottom: none;
    }

    .control-item label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-weight: 600;
      color: var(--fg);
      margin-bottom: 4px;
    }

    .control-item input[type="checkbox"] {
      width: auto;
      margin-right: 8px;
      cursor: pointer;
    }

    .control-item small {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-left: 28px;
    }

    .control-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .control-actions button {
      flex: 1;
      padding: 8px 12px;
      font-size: 12px;
    }

    /* 移动端优化 */
    @media (max-width: 768px) {
      #effectsControlPanel {
        bottom: 10px;
        right: 10px;
        width: calc(100% - 20px);
        max-width: 300px;
      }
    }

    /* 可拖拽样式 */
    .control-panel-header {
      cursor: move;
    }
  `;
  document.head.appendChild(style);

  // 添加拖拽功能
  function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.control-panel-header');

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.bottom = 'auto';
      element.style.right = 'auto';
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        EffectsControl.init();
        const panel = document.getElementById('effectsControlPanel');
        if (panel) makeDraggable(panel);
      }, 1500);
    });
  } else {
    setTimeout(() => {
      EffectsControl.init();
      const panel = document.getElementById('effectsControlPanel');
      if (panel) makeDraggable(panel);
    }, 1500);
  }

  // 导出到全局
  window.MathCampEffectsControl = EffectsControl;

})();
