/**
 * 喵喵数学 - 答题体验增强系统
 * 包含：题目卡片翻转、聚焦模式、连对特效、通关动画、倒计时视觉化
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

  const QuestionEnhancements = {
    enabled: effectSettingEnabled('questionEnhancements'),
    currentStreak: 0,
    focusModeActive: false,

    init() {
      if (!this.enabled) return;
      this.setupCardFlip();
      this.setupFocusMode();
      this.setupStreakEffects();
      this.setupLevelComplete();
      this.enhanceTimer();

      console.log('[答题增强] 已启动');
    },

    /**
     * 题目卡片3D翻转
     */
    setupCardFlip() {
      // 监听题目切换
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const questionCard = document.querySelector('.practice-card, .question-card');
          if (questionCard && mutation.target === questionCard) {
            this.triggerCardFlip(questionCard);
          }
        });
      });

      setTimeout(() => {
        const practiceArea = document.querySelector('.practice-workspace, .main-stack');
        if (practiceArea) {
          observer.observe(practiceArea, {
            childList: true,
            subtree: true
          });
        }
      }, 1000);
    },

    triggerCardFlip(card) {
      if (!this.enabled) return;
      card.style.transformStyle = 'preserve-3d';
      card.style.animation = 'questionCardFlip 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';

      setTimeout(() => {
        card.style.animation = '';
      }, 600);
    },

    /**
     * 聚焦模式 - 答题时背景虚化
     */
    setupFocusMode() {
      if (!effectSettingEnabled('focusBlur')) return;
      // 创建遮罩层
      const overlay = document.createElement('div');
      overlay.id = 'focusModeOverlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0px);
        -webkit-backdrop-filter: blur(0px);
        pointer-events: none;
        z-index: 5;
        transition: all 0.5s ease;
        opacity: 0;
      `;
      document.body.appendChild(overlay);

      // 监听答题开始
      document.addEventListener('click', (e) => {
        if (!this.enabled || !effectSettingEnabled('focusBlur')) return;
        const isQuestionArea = e.target.closest('.practice-card, .question-card, #answerInput, #submitBtn');
        if (isQuestionArea && !this.focusModeActive) {
          this.enterFocusMode();
        }
      });

      // 监听答题完成
      document.addEventListener('correct-animation', () => this.exitFocusMode());
      document.addEventListener('wrong-animation', () => this.exitFocusMode());
    },

    enterFocusMode() {
      if (!this.enabled || !effectSettingEnabled('focusBlur')) return;
      this.focusModeActive = true;
      const overlay = document.getElementById('focusModeOverlay');
      if (overlay) {
        overlay.style.opacity = '1';
        overlay.style.background = 'rgba(0, 0, 0, 0.3)';
        overlay.style.backdropFilter = 'blur(8px)';
        overlay.style.webkitBackdropFilter = 'blur(8px)';
      }

      // 题目卡片突出显示
      const card = document.querySelector('.practice-card, .question-card');
      if (card) {
        card.style.position = 'relative';
        card.style.zIndex = '10';
        card.style.transform = 'scale(1.02)';
        card.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.3)';
        card.style.transition = 'all 0.5s ease';
      }
    },

    exitFocusMode() {
      setTimeout(() => {
        this.focusModeActive = false;
        const overlay = document.getElementById('focusModeOverlay');
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.background = 'rgba(0, 0, 0, 0)';
          overlay.style.backdropFilter = 'blur(0px)';
          overlay.style.webkitBackdropFilter = 'blur(0px)';
        }

        const card = document.querySelector('.practice-card, .question-card');
        if (card) {
          card.style.transform = 'scale(1)';
          card.style.boxShadow = '';
        }
      }, 500);
    },

    /**
     * 连对特效升级
     */
    setupStreakEffects() {
      // 监听正确答案
      document.addEventListener('correct-animation', () => {
        if (!this.enabled) return;
        this.currentStreak++;
        this.showStreakEffect();
      });

      // 监听错误答案
      document.addEventListener('wrong-animation', () => {
        if (!this.enabled) return;
        this.currentStreak = 0;
      });
    },

    showStreakEffect() {
      if (!this.enabled || !effectSettingEnabled('rewardParticles')) return;
      const effects = {
        3: { text: '3连对！🔥', color: '#ff6b6b', size: 'normal' },
        5: { text: '5连对！⚡', color: '#ffd700', size: 'big' },
        10: { text: '10连对！🌟', color: '#9b59b6', size: 'huge' },
        15: { text: '15连对！💎', color: '#3498db', size: 'huge' }
      };

      const effect = effects[this.currentStreak];
      if (!effect) return;

      // 创建特效文字
      const streakText = document.createElement('div');
      streakText.className = 'streak-effect';
      streakText.textContent = effect.text;
      streakText.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        font-size: ${effect.size === 'huge' ? '72px' : effect.size === 'big' ? '56px' : '42px'};
        font-weight: bold;
        color: ${effect.color};
        text-shadow: 0 0 20px ${effect.color}, 0 0 40px ${effect.color};
        pointer-events: none;
        z-index: 9999;
        animation: streakPop 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      `;

      document.body.appendChild(streakText);

      // 粒子爆炸
      if (window.MathCampUIAnimations) {
        window.MathCampUIAnimations.createStarBurst(
          window.innerWidth / 2,
          window.innerHeight / 2,
          this.currentStreak >= 10 ? 30 : this.currentStreak >= 5 ? 20 : 15,
          effect.color
        );
      }

      setTimeout(() => streakText.remove(), 1500);
    },

    /**
     * 关卡通关动画
     */
    setupLevelComplete() {
      // 监听练习完成
      const observer = new MutationObserver((mutations) => {
        if (!this.enabled) return;
        mutations.forEach((mutation) => {
          if (mutation.target.textContent?.includes('完成') ||
              mutation.target.textContent?.includes('通关')) {
            this.triggerLevelComplete();
          }
        });
      });

      setTimeout(() => {
        const resultArea = document.querySelector('.result-panel, .feedback');
        if (resultArea) {
          observer.observe(resultArea, {
            childList: true,
            characterData: true,
            subtree: true
          });
        }
      }, 1000);
    },

    triggerLevelComplete() {
      if (!this.enabled || !effectSettingEnabled('rewardParticles')) return;
      // 礼花效果
      this.createConfetti();

      // 成就徽章
      if (window.MathCampUIAnimations) {
        window.MathCampUIAnimations.showAchievement(
          '恭喜通关！',
          '你完成了这一轮练习！',
          '🎉'
        );
      }

      // 播放音效（如果有）
      this.playSound('finish');
    },

    createConfetti() {
      if (!this.enabled || !effectSettingEnabled('rewardParticles')) return;
      const colors = ['#ff6b6b', '#ffd700', '#4ecdc4', '#45b7d1', '#f7b731', '#ff6348'];
      const confettiCount = 50;

      for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
          const confetti = document.createElement('div');
          const x = Math.random() * window.innerWidth;
          const color = colors[Math.floor(Math.random() * colors.length)];
          const rotation = Math.random() * 360;
          const size = 8 + Math.random() * 8;

          confetti.className = 'confetti-piece';
          confetti.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: -20px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            pointer-events: none;
            z-index: 9999;
            animation: confettiFall ${2 + Math.random()}s ease-out forwards;
            transform: rotate(${rotation}deg);
          `;

          document.body.appendChild(confetti);
          setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
      }
    },

    /**
     * 倒计时视觉化增强
     */
    enhanceTimer() {
      if (!this.enabled) return;
      const timerElement = document.getElementById('timerStat');
      if (!timerElement) return;

      // 创建圆形进度条
      const timerContainer = timerElement.parentElement;
      if (!timerContainer) return;

      const progressRing = document.createElement('div');
      progressRing.className = 'timer-progress-ring';
      progressRing.innerHTML = `
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle class="timer-ring-bg" cx="30" cy="30" r="26"
            fill="none" stroke="var(--border)" stroke-width="4"/>
          <circle class="timer-ring-progress" cx="30" cy="30" r="26"
            fill="none" stroke="var(--accent)" stroke-width="4"
            stroke-dasharray="163.36" stroke-dashoffset="0"
            transform="rotate(-90 30 30)"/>
        </svg>
      `;
      progressRing.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      `;

      timerContainer.style.position = 'relative';
      timerContainer.appendChild(progressRing);

      // 监听时间变化
      const observer = new MutationObserver(() => {
        const text = timerElement.textContent;
        const match = text.match(/(\d+):(\d+)/);
        if (match) {
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const totalSeconds = minutes * 60 + seconds;

          // 更新进度环（假设总时长5分钟）
          const progress = totalSeconds / 300;
          const offset = 163.36 * (1 - progress);
          const progressCircle = progressRing.querySelector('.timer-ring-progress');
          if (progressCircle) {
            progressCircle.style.strokeDashoffset = offset;

            // 时间紧张时变红
            if (totalSeconds < 60) {
              progressCircle.style.stroke = 'var(--danger)';
              progressCircle.style.animation = 'timerPulse 1s ease-in-out infinite';
            } else {
              progressCircle.style.stroke = 'var(--accent)';
              progressCircle.style.animation = '';
            }
          }
        }
      });

      observer.observe(timerElement, {
        childList: true,
        characterData: true,
        subtree: true
      });
    },

    playSound(type) {
      // 触发音效事件（如果已实现音效系统）
      document.dispatchEvent(new CustomEvent('play-sound', { detail: { type } }));
    },

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
      if (!this.enabled) {
        this.currentStreak = 0;
        this.exitFocusMode();
        document.querySelectorAll('.streak-effect, .confetti-piece').forEach(el => el.remove());
      }
    }
  };

  // 添加CSS动画
  const style = document.createElement('style');
  style.textContent = `
    /* 题目卡片翻转 */
    @keyframes questionCardFlip {
      0% {
        transform: rotateY(0deg);
        opacity: 1;
      }
      50% {
        transform: rotateY(90deg);
        opacity: 0.5;
      }
      100% {
        transform: rotateY(0deg);
        opacity: 1;
      }
    }

    /* 连对特效 */
    @keyframes streakPop {
      0% {
        transform: translate(-50%, -50%) scale(0) rotate(-10deg);
        opacity: 0;
      }
      50% {
        transform: translate(-50%, -50%) scale(1.2) rotate(5deg);
        opacity: 1;
      }
      70% {
        transform: translate(-50%, -50%) scale(0.95) rotate(-2deg);
      }
      100% {
        transform: translate(-50%, -50%) scale(1) rotate(0deg) translateY(-50px);
        opacity: 0;
      }
    }

    /* 礼花掉落 */
    @keyframes confettiFall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }

    /* 计时器脉冲 */
    @keyframes timerPulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.7;
        transform: scale(1.1);
      }
    }

    /* 聚焦模式样式 */
    .practice-card,
    .question-card {
      transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }
  `;
  document.head.appendChild(style);

  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => QuestionEnhancements.init(), 800);
    });
  } else {
    setTimeout(() => QuestionEnhancements.init(), 800);
  }

  // 导出到全局
  window.MathCampQuestionEnhancements = QuestionEnhancements;

})();
