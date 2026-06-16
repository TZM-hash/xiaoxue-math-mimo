/**
 * 喵喵数学 - 招财猫互动升级系统
 * 包含：眼睛跟随、多种动作、表情系统、互动反馈、语音气泡
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

  const CatInteraction = {
    enabled: effectSettingEnabled('catInteraction'),
    catElement: null,
    catImage: null,
    eyesElement: null,
    bubbleElement: null,
    randomActionTimer: null,
    currentMood: 'idle',
    actionQueue: [],

    init() {
      if (!this.enabled) return;
      this.findCatElements();
      if (!this.catElement) {
        console.warn('[招财猫] 未找到招财猫元素');
        return;
      }

      this.setupEyeTracking();
      this.setupClickInteraction();
      this.setupRandomActions();
      this.setupMoodSystem();
      this.createSpeechBubble();

      console.log('[招财猫] 互动系统已启动');
    },

    findCatElements() {
      // 查找所有可能的招财猫元素
      const selectors = [
        '.cat img',
        '[data-pet-image]',
        '.brand-mark img',
        '.home-pet-card .cat img'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          this.catImage = element;
          this.catElement = element.closest('.cat') || element.parentElement;
          break;
        }
      }
    },

    /**
     * 眼睛跟随光标
     */
    setupEyeTracking() {
      if (!this.catElement) return;

      // 创建眼睛元素
      const eyesContainer = document.createElement('div');
      eyesContainer.className = 'cat-eyes';
      eyesContainer.innerHTML = `
        <div class="cat-eye cat-eye-left">
          <div class="cat-pupil"></div>
        </div>
        <div class="cat-eye cat-eye-right">
          <div class="cat-pupil"></div>
        </div>
      `;

      this.catElement.appendChild(eyesContainer);
      this.eyesElement = eyesContainer;

      // 眼睛跟随鼠标
      document.addEventListener('mousemove', (e) => {
        if (!this.enabled) return;
        this.updateEyePosition(e.clientX, e.clientY);
      });
    },

    updateEyePosition(mouseX, mouseY) {
      if (!this.eyesElement) return;

      const pupils = this.eyesElement?.querySelectorAll('.cat-pupil');
      if (!pupils) return;

      const catRect = this.catElement.getBoundingClientRect();
      const catCenterX = catRect.left + catRect.width / 2;
      const catCenterY = catRect.top + catRect.height / 2;

      pupils.forEach((pupil, index) => {
        const eye = pupil.parentElement;
        const eyeRect = eye.getBoundingClientRect();
        const eyeCenterX = eyeRect.left + eyeRect.width / 2;
        const eyeCenterY = eyeRect.top + eyeRect.height / 2;

        const angle = Math.atan2(mouseY - eyeCenterY, mouseX - eyeCenterX);
        const distance = Math.min(5, Math.hypot(mouseX - eyeCenterX, mouseY - eyeCenterY) / 50);

        const pupilX = Math.cos(angle) * distance;
        const pupilY = Math.sin(angle) * distance;

        pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
      });
    },

    /**
     * 点击互动
     */
    setupClickInteraction() {
      if (!this.catElement) return;

      this.catElement.style.cursor = 'pointer';

      this.catElement.addEventListener('click', (e) => {
        if (!this.enabled) return;
        e.stopPropagation();
        this.triggerRandomAction();
        this.showSpeechBubble(this.getRandomMessage());
      });
    },

    /**
     * 随机动作
     */
    setupRandomActions() {
      // 每30-60秒触发一次随机动作
      this.randomActionTimer = setInterval(() => {
        if (!this.enabled) return;
        if (Math.random() > 0.7) {
          this.triggerRandomAction();
        }
      }, 45000);
    },

    triggerRandomAction() {
      if (!this.enabled) return;
      const actions = ['jump', 'wave', 'wiggle', 'spin', 'bounce'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      this.performAction(action);
    },

    performAction(action) {
      if (!this.enabled) return;
      if (!this.catImage) return;

      // 移除之前的动画
      this.catImage.className = '';

      // 添加新动画
      setTimeout(() => {
        this.catImage.classList.add(`cat-action-${action}`);
      }, 10);

      // 动画结束后移除
      setTimeout(() => {
        this.catImage.classList.remove(`cat-action-${action}`);
      }, 1000);
    },

    /**
     * 心情系统
     */
    setupMoodSystem() {
      // 监听答题结果
      document.addEventListener('correct-animation', () => {
        if (!this.enabled) return;
        this.setMood('happy');
        this.performAction('jump');
        this.showSpeechBubble('太棒了！继续加油！🎉');
      });

      document.addEventListener('wrong-animation', () => {
        if (!this.enabled) return;
        this.setMood('sad');
        this.performAction('wiggle');
        this.showSpeechBubble('没关系，再试一次！💪');
      });
    },

    setMood(mood) {
      this.currentMood = mood;
      if (this.catElement) {
        this.catElement.setAttribute('data-mood', mood);
      }
    },

    /**
     * 语音气泡
     */
    createSpeechBubble() {
      if (!this.catElement) return;

      const bubble = document.createElement('div');
      bubble.className = 'cat-speech-bubble';
      bubble.style.cssText = `
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%) scale(0);
        background: white;
        padding: 12px 16px;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        font-size: 14px;
        font-weight: bold;
        color: var(--fg);
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      `;

      // 添加箭头
      const arrow = document.createElement('div');
      arrow.style.cssText = `
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid white;
      `;
      bubble.appendChild(arrow);

      this.catElement.appendChild(bubble);
      this.bubbleElement = bubble;
    },

    showSpeechBubble(text, duration = 3000) {
      if (!this.enabled) return;
      if (!this.bubbleElement) return;

      // 移除箭头后设置文本
      const arrow = this.bubbleElement.querySelector('div');
      this.bubbleElement.textContent = text;
      if (arrow) this.bubbleElement.appendChild(arrow);

      // 显示气泡
      this.bubbleElement.style.opacity = '1';
      this.bubbleElement.style.transform = 'translateX(-50%) scale(1)';

      // 自动隐藏
      setTimeout(() => {
        this.bubbleElement.style.opacity = '0';
        this.bubbleElement.style.transform = 'translateX(-50%) scale(0.8)';
      }, duration);
    },

    getRandomMessage() {
      const messages = [
        '喵~ 一起加油！',
        '你好厉害！',
        '继续保持哦！',
        '我相信你！',
        '今天也要努力！',
        '做得真棒！',
        '学习使我快乐！',
        '数学好有趣！'
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    },

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
      if (!this.enabled) {
        if (this.randomActionTimer) {
          clearInterval(this.randomActionTimer);
          this.randomActionTimer = null;
        }
        this.eyesElement?.remove();
        this.bubbleElement?.remove();
        this.eyesElement = null;
        this.bubbleElement = null;
      } else {
        this.init();
      }
    }
  };

  // 添加CSS样式
  const style = document.createElement('style');
  style.textContent = `
    /* 猫咪容器 */
    .cat {
      position: relative;
      user-select: none;
    }

    /* 眼睛 */
    .cat-eyes {
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 20px;
      pointer-events: none;
      z-index: 10;
    }

    .cat-eye {
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      position: relative;
      border: 2px solid #333;
    }

    .cat-pupil {
      width: 6px;
      height: 6px;
      background: #333;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease;
    }

    /* 心情状态 */
    .cat[data-mood="happy"] .cat-eye {
      animation: cat-eye-happy 0.5s ease;
    }

    .cat[data-mood="sad"] .cat-eye {
      transform: scaleY(0.6);
    }

    @keyframes cat-eye-happy {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(0.2); }
    }

    /* 动作动画 */
    .cat-action-jump {
      animation: cat-jump 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes cat-jump {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-30px); }
    }

    .cat-action-wave {
      animation: cat-wave 0.8s ease-in-out;
    }

    @keyframes cat-wave {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-15deg); }
      75% { transform: rotate(15deg); }
    }

    .cat-action-wiggle {
      animation: cat-wiggle 0.5s ease-in-out;
    }

    @keyframes cat-wiggle {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    .cat-action-spin {
      animation: cat-spin 0.8s ease-in-out;
    }

    @keyframes cat-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .cat-action-bounce {
      animation: cat-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes cat-bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    /* 气泡动画 */
    .cat-speech-bubble {
      animation: bubble-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes bubble-in {
      from {
        opacity: 0;
        transform: translateX(-50%) scale(0.8) translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) scale(1) translateY(0);
      }
    }

    /* 移动端优化 */
    @media (max-width: 768px) {
      .cat-eyes {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);

  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => CatInteraction.init(), 500);
    });
  } else {
    setTimeout(() => CatInteraction.init(), 500);
  }

  // 导出到全局
  window.MathCampCatInteraction = CatInteraction;

})();
