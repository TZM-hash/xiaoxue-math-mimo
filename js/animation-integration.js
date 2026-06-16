/**
 * 喵喵数学 - UI动画集成增强
 * 与现有app.js和ui-feedback.js集成
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

  // 等待DOM和其他脚本加载完成
  const AnimationIntegration = {
    enabled: effectSettingEnabled('uiAnimations'),

    init() {
      if (!this.enabled) return;
      // 确保在DOM加载完成后执行
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    },

    setup() {
      if (!this.enabled) return;
      console.log('[动画集成] 开始初始化...');

      // 等待主应用和UI动画模块加载
      setTimeout(() => {
        this.enhanceExistingUI();
        this.hookIntoFeedback();
        this.setupAnswerFeedback();
        this.setupCoinAnimations();
        this.setupNumberCounters();
        console.log('[动画集成] 初始化完成');
      }, 300);
    },

    /**
     * 增强现有UI元素
     */
    enhanceExistingUI() {
      if (!this.enabled) return;
      // 为卡片添加3D效果
      const cards = document.querySelectorAll('.home-mode-card, .challenge-panel');
      cards.forEach(card => {
        if (window.MathCampUIAnimations) {
          window.MathCampUIAnimations.add3DTiltEffect(card);
        }
      });

      // 为进度条添加流光
      const progressBars = document.querySelectorAll('.progress-fill, .xp-fill');
      progressBars.forEach(bar => {
        bar.parentElement?.classList.add('progress-bar');
      });
    },

    /**
     * 接入现有的UI反馈系统
     */
    hookIntoFeedback() {
      if (!this.enabled) return;
      // 增强toast通知
      const originalNotify = window.MathCampUIFeedback?.notify;
      if (originalNotify) {
        window.MathCampUIFeedback.notify = (message, options = {}) => {
          originalNotify.call(window.MathCampUIFeedback, message, options);

          // 为toast添加进入动画
          setTimeout(() => {
            const toasts = document.querySelectorAll('.app-toast:not(.animated)');
            toasts.forEach(toast => {
              toast.classList.add('animated', 'bounce-in');
            });
          }, 50);
        };
      }

      // 监听对话框
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.classList && node.classList.contains('app-dialog')) {
              node.style.animation = 'fadeInScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            }
          });
        });
      });

      const dialogLayer = document.querySelector('.app-dialog-layer');
      if (dialogLayer) {
        observer.observe(dialogLayer, { childList: true, subtree: true });
      }
    },

    /**
     * 设置答题反馈动画
     */
    setupAnswerFeedback() {
      if (!this.enabled) return;
      // 监听答题结果
      document.addEventListener('click', (e) => {
        if (!this.enabled) return;
        // 监听提交答案按钮
        if (e.target.closest('[data-submit-answer], #submitBtn')) {
          setTimeout(() => this.checkAnswerFeedback(), 200);
        }
      });

      // 使用MutationObserver监听反馈元素
      const feedbackObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.classList) {
              if (node.classList.contains('feedback') ||
                  node.textContent?.includes('正确') ||
                  node.textContent?.includes('✓')) {
                this.triggerCorrectAnimation(node);
              } else if (node.textContent?.includes('错误') ||
                        node.textContent?.includes('×')) {
                this.triggerWrongAnimation(node);
              }
            }
          });
        });
      });

      // 观察练习区域
      const practiceArea = document.querySelector('.practice-workspace, .main-stack');
      if (practiceArea) {
        feedbackObserver.observe(practiceArea, {
          childList: true,
          subtree: true
        });
      }
    },

    /**
     * 检查答题反馈
     */
    checkAnswerFeedback() {
      const feedback = document.querySelector('.feedback, .result-panel');
      if (!feedback) return;

      const isCorrect = feedback.textContent.includes('正确') ||
                       feedback.textContent.includes('✓') ||
                       feedback.classList.contains('correct');

      if (isCorrect) {
        this.triggerCorrectAnimation(feedback);
      } else {
        this.triggerWrongAnimation(feedback);
      }
    },

    /**
     * 触发正确答案动画
     */
    triggerCorrectAnimation(element) {
      if (!this.enabled) return;
      if (!element || !window.MathCampUIAnimations) return;

      // 添加庆祝动画
      window.MathCampUIAnimations.celebrateCorrect(element);

      // 创建星星爆炸
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      window.MathCampUIAnimations.createStarBurst(x, y, 12, '#4ade80');

      // 触发数字增加动画
      this.animateStatIncrease();
    },

    /**
     * 触发错误答案动画
     */
    triggerWrongAnimation(element) {
      if (!this.enabled) return;
      if (!element || !window.MathCampUIAnimations) return;

      window.MathCampUIAnimations.showWrongFeedback(element);
    },

    /**
     * 设置金币动画
     */
    setupCoinAnimations() {
      if (!this.enabled) return;
      // 监听金币变化
      const coinPill = document.getElementById('petCoinPill');
      if (!coinPill) return;

      const coinObserver = new MutationObserver(() => {
        // 金币数量变化时触发动画
        coinPill.classList.add('pulse-it');
        setTimeout(() => coinPill.classList.remove('pulse-it'), 600);
      });

      coinObserver.observe(coinPill, {
        childList: true,
        characterData: true,
        subtree: true
      });
    },

    /**
     * 设置数字滚动计数器
     */
    setupNumberCounters() {
      if (!this.enabled) return;
      // 监听统计数字变化
      const statElements = [
        '#correctStat',
        '#streakStat',
        '#progressStat',
        '#todayPill'
      ];

      statElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (!element) return;

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              const target = mutation.target.closest('strong') || mutation.target;
              const text = target.textContent;
              const match = text.match(/\d+/);

              if (match && window.MathCampUIAnimations) {
                const newValue = parseInt(match[0], 10);
                // 移除数字变化时的跳变动画
                // target.closest('.stat, .pill')?.classList.add('updated');
                // setTimeout(() => {
                //   target.closest('.stat, .pill')?.classList.remove('updated');
                // }, 500);
              }
            }
          });
        });

        observer.observe(element, {
          childList: true,
          characterData: true,
          subtree: true
        });
      });
    },

    /**
     * 统计数据增加动画
     */
    animateStatIncrease() {
      if (!this.enabled) return;
      const stats = document.querySelectorAll('.stat');
      stats.forEach(stat => {
        stat.classList.add('updated');
        setTimeout(() => stat.classList.remove('updated'), 500);
      });
    },

    /**
     * 成就解锁通知
     */
    showAchievementUnlock(title, description, icon = '🏆') {
      if (!this.enabled) return;
      if (window.MathCampUIAnimations) {
        window.MathCampUIAnimations.showAchievement(title, description, icon);
      }
    },

    /**
     * 金币飞入动画
     */
    animateCoinEarned(amount = 5) {
      if (!this.enabled) return;
      const coinPill = document.getElementById('petCoinPill');
      if (!coinPill || !window.MathCampUIAnimations) return;

      // 从屏幕中心创建金币飞向金币显示区域
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      window.MathCampUIAnimations.createCoinFly(
        centerX,
        centerY,
        coinPill,
        Math.min(amount, 8)
      );
    },

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
    }
  };

  // 自动初始化
  AnimationIntegration.init();

  // 导出到全局，供其他模块调用
  window.MathCampAnimationIntegration = AnimationIntegration;

})();
