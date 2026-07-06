/**
 * 喵喵学习 - 特效控制系统（集成到系统设置）
 * 通过系统设置二级菜单控制所有特效
 */

(function() {
  'use strict';

  const EffectsControl = {
    settings: window.MathCampRuntime?.defaultEffectSettings?.() || {
      cursorEffects: true,
      seasonEffects: true,
      themeBackgrounds: true,
      catInteraction: true,
      questionEnhancements: true,
      microInteractions: true,
      uiAnimations: true,
      rewardParticles: true,
      focusBlur: true,
      ambientAnimations: true
    },

    init() {
      this.loadSettings();
      this.applySettings();
      this.bindEvents();

      console.log('[特效控制] 已启动（集成模式）');
    },

    /**
     * 加载保存的设置
     */
    loadSettings() {
      try {
        this.settings = { ...(window.MathCampRuntime?.defaultEffectSettings?.() || this.settings), ...this.settings };
        const saved = localStorage.getItem('mathcamp-effects-settings');
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.warn('[特效控制] 加载设置失败', e);
      }
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
      this.applyDocumentClasses();

      if (!this.settings.cursorEffects && window.MathCampCursorEffects) {
        window.MathCampCursorEffects.disable();
      }

      if (!this.settings.seasonEffects && window.MathCampSeasonEffects) {
        window.MathCampSeasonEffects.stopEffect();
      }

      if (!this.settings.themeBackgrounds && window.MathCampThemeBackgrounds) {
        window.MathCampThemeBackgrounds.clearBackground();
      }

      if (window.MathCampUIAnimations?.setEnabled) {
        window.MathCampUIAnimations.setEnabled(this.settings.uiAnimations);
      }

      if (window.MathCampAnimationIntegration?.setEnabled) {
        window.MathCampAnimationIntegration.setEnabled(this.settings.uiAnimations);
      }

      if (window.MathCampQuestionEnhancements?.setEnabled) {
        window.MathCampQuestionEnhancements.setEnabled(this.settings.questionEnhancements);
      }

      if (window.MathCampCatInteraction?.setEnabled) {
        window.MathCampCatInteraction.setEnabled(this.settings.catInteraction);
      }

      if (window.MathCampMicroInteractions?.setEnabled) {
        window.MathCampMicroInteractions.setEnabled(this.settings.microInteractions);
      }

      // 更新UI状态
      this.updateUIState();
    },

    applyDocumentClasses() {
      const root = document.documentElement;
      root.classList.toggle('effects-ui-animations-off', !this.settings.uiAnimations);
      root.classList.toggle('effects-reward-particles-off', !this.settings.rewardParticles);
      root.classList.toggle('effects-focus-blur-off', !this.settings.focusBlur);
      root.classList.toggle('effects-ambient-off', !this.settings.ambientAnimations);
    },

    /**
     * 更新UI状态
     */
    updateUIState() {
      setTimeout(() => {
        Object.keys(this.settings).forEach(key => {
          const toggle = document.getElementById(`${key}Toggle`);
          if (toggle) {
            toggle.checked = this.settings[key];
            this.updateLabel(toggle);
          }
        });
      }, 500);
    },

    /**
     * 更新开关旁的开/关文字
     */
    updateLabel(input) {
      const label = input.closest('.effects-toggle')?.querySelector('.effects-toggle-label');
      if (label) {
        label.textContent = input.checked ? '开' : '关';
      }
    },

    /**
     * 更新所有开关的开/关文字
     */
    updateAllLabels() {
      document.querySelectorAll('.effects-toggle input[type="checkbox"]').forEach(input => {
        this.updateLabel(input);
      });
    },

    /**
     * 绑定事件
     */
    bindEvents() {
      // 等待DOM加载
      setTimeout(() => {
        // 打开特效设置按钮
        const openBtn = document.getElementById('openEffectsSettingsBtn');
        if (openBtn) {
          openBtn.addEventListener('click', () => this.openModal());
        }

        // 关闭按钮
        const closeBtn = document.querySelector('[data-close-effects]');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => this.closeModal());
        }

        // 保存并关闭按钮
        const saveBtn = document.getElementById('saveEffectsBtn');
        if (saveBtn) {
          saveBtn.addEventListener('click', () => {
            this.saveSettings();
            this.closeModal();
            if (window.MathCampUIFeedback) {
              window.MathCampUIFeedback.notify('特效设置已保存');
            }
          });
        }

        // 点击背景关闭
        const modal = document.getElementById('effectsSettingsModal');
        if (modal) {
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              this.closeModal();
            }
          });
        }

      }, 1000);
    },

    /**
     * 打开模态框
     */
    openModal() {
      const modal = document.getElementById('effectsSettingsModal');
      if (modal) {
        modal.hidden = false;
        modal.classList.add('modal-open');

        // 更新开关状态
        this.updateUIState();
        this.updateAllLabels();

        // 绑定开关事件（每次打开时重新绑定）
        this.bindToggleEvents();

        // 绑定恢复默认按钮
        this.bindResetButton();

        // 添加进入动画
        setTimeout(() => {
          const panel = modal.querySelector('.hub-modal-panel');
          if (panel) {
            panel.style.animation = 'modalPanelIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
          }
        }, 10);
      }

      // 关闭系统设置模态框
      const systemModal = document.getElementById('systemModal');
      if (systemModal) {
        systemModal.hidden = true;
      }
    },

    /**
     * 绑定恢复默认按钮
     */
    bindResetButton() {
      const resetBtn = document.getElementById('resetAllEffectsBtn');
      if (resetBtn) {
        // 移除旧事件
        const newBtn = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(newBtn, resetBtn);

        // 添加新事件
        newBtn.addEventListener('click', () => this.resetToDefault());
      }
    },

    /**
     * 绑定开关事件（使用事件委托，避免克隆）
     */
    bindToggleEvents() {
      const grid = document.querySelector('.effects-settings-grid');
      if (!grid) return;

      // 移除旧监听器
      grid.removeEventListener('change', this._onGridChange);

      // 创建新监听器并保存引用
      this._onGridChange = (e) => {
        if (e.target.dataset.effect) {
          const effect = e.target.dataset.effect;
          this.settings[effect] = e.target.checked;
          this.saveSettings();
          this.toggleEffect(effect, e.target.checked);
          this.updateLabel(e.target);

          if (window.MathCampUIFeedback) {
            const effectName = e.target.checked ? '已启用' : '已禁用';
            window.MathCampUIFeedback.notify(`特效${effectName}`);
          }
        }
      };

      grid.addEventListener('change', this._onGridChange);
    },

    /**
     * 关闭模态框
     */
    closeModal() {
      const modal = document.getElementById('effectsSettingsModal');
      if (modal) {
        const panel = modal.querySelector('.hub-modal-panel');
        if (panel) {
          panel.style.animation = 'modalPanelOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }

        setTimeout(() => {
          modal.hidden = true;
          modal.classList.remove('modal-open');

          // 重新打开系统设置模态框
          const systemModal = document.getElementById('systemModal');
          if (systemModal) {
            systemModal.hidden = false;
          }
        }, 300);
      }
    },

    /**
     * 恢复默认设置
     */
    resetToDefault() {
      this.settings = {
        cursorEffects: true,
        seasonEffects: true,
        themeBackgrounds: true,
        catInteraction: true,
        questionEnhancements: true,
        microInteractions: true,
        uiAnimations: true,
        rewardParticles: true,
        focusBlur: true,
        ambientAnimations: true
      };

      this.saveSettings();
      this.applyDocumentClasses();
      this.updateUIState();

      // 重新启用所有特效
      Object.keys(this.settings).forEach(key => {
        this.toggleEffect(key, true);
      });

      if (window.MathCampUIFeedback) {
        window.MathCampUIFeedback.notify('已恢复默认设置');
      }
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

        case 'catInteraction':
          if (window.MathCampCatInteraction?.setEnabled) {
            window.MathCampCatInteraction.setEnabled(enabled);
          }
          break;

        case 'uiAnimations':
          if (window.MathCampUIAnimations?.setEnabled) {
            window.MathCampUIAnimations.setEnabled(enabled);
          }
          if (window.MathCampAnimationIntegration?.setEnabled) {
            window.MathCampAnimationIntegration.setEnabled(enabled);
          }
          this.applyDocumentClasses();
          break;

        case 'rewardParticles':
        case 'focusBlur':
        case 'ambientAnimations':
          this.applyDocumentClasses();
          break;

        case 'questionEnhancements':
          if (window.MathCampQuestionEnhancements?.setEnabled) {
            window.MathCampQuestionEnhancements.setEnabled(enabled);
          }
          break;

        case 'microInteractions':
          if (window.MathCampMicroInteractions?.setEnabled) {
            window.MathCampMicroInteractions.setEnabled(enabled);
          }
          break;

        default:
          // 其他效果需要刷新页面
          console.log(`[特效控制] ${name} 已${enabled ? '启用' : '禁用'}，刷新页面后生效`);
          break;
      }
    }
  };

  // 添加CSS样式
  const style = document.createElement('style');
  style.textContent = `
    .effects-settings-panel {
      max-width: 600px;
      width: 90vw;
    }
  `;
  document.head.appendChild(style);

  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => EffectsControl.init(), 1000);
    });
  } else {
    setTimeout(() => EffectsControl.init(), 1000);
  }

  // 导出到全局
  window.MathCampEffectsControl = EffectsControl;

})();
