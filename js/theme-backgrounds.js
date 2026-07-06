/**
 * 喵喵学习 - 动态主题背景系统
 * 每个主题独特的动画背景效果
 */

(function() {
  'use strict';

  function effectSettingEnabled(key) {
    if (window.MathCampRuntime?.effectSettingEnabled) return window.MathCampRuntime.effectSettingEnabled(key);
    try {
      const saved = JSON.parse(localStorage.getItem('mathcamp-effects-settings') || '{}');
      return saved[key] !== false;
    } catch (e) {
      return true;
    }
  }

  const ThemeBackgrounds = {
    currentTheme: null,
    animationElements: [],

    init() {
      if (!effectSettingEnabled('themeBackgrounds')) {
        this.clearBackground();
        return;
      }
      this.detectTheme();
      this.watchThemeChanges();

      console.log('[主题背景] 已启动');
    },

    /**
     * 检测当前主题
     */
    detectTheme() {
      if (!effectSettingEnabled('themeBackgrounds')) {
        this.clearBackground();
        return;
      }
      const theme = document.documentElement.dataset.theme || 'classic';
      this.applyThemeBackground(theme);
    },

    /**
     * 监听主题变化
     */
    watchThemeChanges() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            const newTheme = document.documentElement.dataset.theme;
            this.applyThemeBackground(newTheme);
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    },

    /**
     * 应用主题背景
     */
    applyThemeBackground(theme) {
      if (!effectSettingEnabled('themeBackgrounds')) {
        this.clearBackground();
        return;
      }
      if (this.currentTheme === theme) return;

      // 清除旧背景
      this.clearBackground();

      // 添加切换过渡动画
      document.body.style.transition = 'background 0.6s ease';

      this.currentTheme = theme;

      // 应用新背景
      switch(theme) {
        case 'star':
          this.createStarryBackground();
          break;
        case 'forest':
          this.createForestBackground();
          break;
        case 'anime':
          this.createAnimeBackground();
          break;
        case 'purple':
          this.createPurpleBackground();
          break;
        case 'candy':
          this.createCandyBackground();
          break;
        default:
          // classic, eye-care 使用默认背景
          break;
      }
    },

    /**
     * 清除背景元素
     */
    clearBackground() {
      this.animationElements.forEach(el => el.remove());
      this.animationElements = [];
      this.currentTheme = null;
    },

    /**
     * 星空主题 - 流星和星星闪烁
     */
    createStarryBackground() {
      // 创建星星
      for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        const size = 2 + Math.random() * 3;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = 1 + Math.random() * 2;
        const delay = Math.random() * 3;

        star.className = 'theme-star';
        star.style.cssText = `
          position: fixed;
          left: ${x}%;
          top: ${y}%;
          width: ${size}px;
          height: ${size}px;
          background: white;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          animation: starTwinkle ${duration}s ease-in-out ${delay}s infinite;
          box-shadow: 0 0 ${size * 2}px rgba(255, 255, 255, 0.8);
        `;

        document.body.appendChild(star);
        this.animationElements.push(star);
      }

      // 创建流星
      const createMeteor = () => {
        const meteor = document.createElement('div');
        const startX = Math.random() * 100;
        const startY = Math.random() * 30;

        meteor.className = 'theme-meteor';
        meteor.style.cssText = `
          position: fixed;
          left: ${startX}%;
          top: ${startY}%;
          width: 200px;
          height: 2px;
          background: linear-gradient(90deg, transparent, white, transparent);
          pointer-events: none;
          z-index: 0;
          transform: rotate(-45deg);
          animation: meteorFall 1.5s linear forwards;
        `;

        document.body.appendChild(meteor);
        setTimeout(() => meteor.remove(), 1500);
      };

      // 定期创建流星
      const meteorInterval = setInterval(() => {
        if (this.currentTheme !== 'star') {
          clearInterval(meteorInterval);
          return;
        }
        if (Math.random() > 0.7) {
          createMeteor();
        }
      }, 3000);
    },

    /**
     * 森林主题 - 树叶飘动和蝴蝶
     */
    createForestBackground() {
      // 创建飘动的树叶背景
      for (let i = 0; i < 15; i++) {
        const leaf = document.createElement('div');
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = 4 + Math.random() * 4;
        const delay = Math.random() * 5;

        leaf.className = 'theme-forest-leaf';
        leaf.textContent = '🍃';
        leaf.style.cssText = `
          position: fixed;
          left: ${x}%;
          top: ${y}%;
          font-size: ${10 + Math.random() * 10}px;
          pointer-events: none;
          z-index: 0;
          opacity: 0.3;
          animation: forestLeafFloat ${duration}s ease-in-out ${delay}s infinite;
        `;

        document.body.appendChild(leaf);
        this.animationElements.push(leaf);
      }
    },

    /**
     * 二次元主题 - 樱花和光效
     */
    createAnimeBackground() {
      // 创建光点
      for (let i = 0; i < 30; i++) {
        const light = document.createElement('div');
        const size = 3 + Math.random() * 5;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = 2 + Math.random() * 3;
        const delay = Math.random() * 2;

        light.className = 'theme-anime-light';
        light.style.cssText = `
          position: fixed;
          left: ${x}%;
          top: ${y}%;
          width: ${size}px;
          height: ${size}px;
          background: radial-gradient(circle, rgba(255, 192, 203, 0.8), transparent);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          animation: animeLightFloat ${duration}s ease-in-out ${delay}s infinite;
        `;

        document.body.appendChild(light);
        this.animationElements.push(light);
      }
    },

    /**
     * 紫色主题 - 魔法粒子
     */
    createPurpleBackground() {
      // 创建魔法粒子
      for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        const size = 4 + Math.random() * 6;
        const x = Math.random() * 100;
        const y = 100 + Math.random() * 20;
        const duration = 5 + Math.random() * 5;
        const delay = Math.random() * 3;

        particle.className = 'theme-purple-particle';
        particle.style.cssText = `
          position: fixed;
          left: ${x}%;
          top: ${y}%;
          width: ${size}px;
          height: ${size}px;
          background: rgba(139, 92, 246, 0.6);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          animation: purpleParticleRise ${duration}s ease-in ${delay}s infinite;
          box-shadow: 0 0 ${size * 3}px rgba(139, 92, 246, 0.8);
        `;

        document.body.appendChild(particle);
        this.animationElements.push(particle);
      }
    },

    /**
     * 糖果主题 - 糖果雨
     */
    createCandyBackground() {
      const candyEmojis = ['🍬', '🍭', '🍫', '🧁', '🍰'];

      const createCandy = () => {
        if (this.animationElements.length >= 30) return;

        const candy = document.createElement('div');
        const emoji = candyEmojis[Math.floor(Math.random() * candyEmojis.length)];
        const x = Math.random() * 100;
        const duration = 5 + Math.random() * 5;
        const delay = Math.random() * 2;

        candy.className = 'theme-candy';
        candy.textContent = emoji;
        candy.style.cssText = `
          position: fixed;
          left: ${x}%;
          top: -30px;
          font-size: ${12 + Math.random() * 12}px;
          pointer-events: none;
          z-index: 0;
          opacity: 0.7;
          animation: candyFall ${duration}s linear ${delay}s infinite;
        `;

        document.body.appendChild(candy);
        this.animationElements.push(candy);
      };

      // 初始创建
      for (let i = 0; i < 20; i++) {
        setTimeout(() => createCandy(), i * 200);
      }
    }
  };

  // 添加CSS动画
  const style = document.createElement('style');
  style.textContent = `
    /* 星星闪烁 */
    @keyframes starTwinkle {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.5); }
    }

    /* 流星 */
    @keyframes meteorFall {
      0% {
        opacity: 0;
        transform: translateX(0) translateY(0) rotate(-45deg);
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 0.5;
      }
      100% {
        opacity: 0;
        transform: translateX(300px) translateY(300px) rotate(-45deg);
      }
    }

    /* 森林树叶飘动 */
    @keyframes forestLeafFloat {
      0%, 100% {
        transform: translateY(0) translateX(0) rotate(0deg);
      }
      25% {
        transform: translateY(-20px) translateX(10px) rotate(90deg);
      }
      50% {
        transform: translateY(0) translateX(20px) rotate(180deg);
      }
      75% {
        transform: translateY(-10px) translateX(10px) rotate(270deg);
      }
    }

    /* 二次元光点 */
    @keyframes animeLightFloat {
      0%, 100% {
        transform: translateY(0) scale(1);
        opacity: 0.3;
      }
      50% {
        transform: translateY(-30px) scale(1.5);
        opacity: 0.8;
      }
    }

    /* 紫色粒子上升 */
    @keyframes purpleParticleRise {
      0% {
        transform: translateY(0) scale(0.5);
        opacity: 0;
      }
      20% {
        opacity: 0.8;
      }
      80% {
        opacity: 0.8;
      }
      100% {
        transform: translateY(-100vh) scale(1);
        opacity: 0;
      }
    }

    /* 糖果掉落 */
    @keyframes candyFall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 0.7;
      }
      90% {
        opacity: 0.7;
      }
      100% {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }

    /* 主题切换过渡 */
    [data-theme] {
      transition: background 0.6s ease;
    }

    /* 移动端优化 */
    @media (max-width: 768px) {
      .theme-star:nth-child(n+20),
      .theme-forest-leaf:nth-child(n+8),
      .theme-anime-light:nth-child(n+15),
      .theme-purple-particle:nth-child(n+12),
      .theme-candy:nth-child(n+10) {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);

  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeBackgrounds.init());
  } else {
    ThemeBackgrounds.init();
  }

  // 导出到全局
  window.MathCampThemeBackgrounds = ThemeBackgrounds;

})();
