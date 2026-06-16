/**
 * 喵喵数学 - 季节天气效果系统
 * 包含：春樱、夏萤、秋叶、冬雪、下雨等动态背景效果
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

  const SeasonEffects = {
    currentEffect: null,
    particles: [],
    maxParticles: 50,
    animationFrame: null,

    init() {
      if (!effectSettingEnabled('seasonEffects')) {
        this.stopEffect();
        return;
      }
      // 根据当前日期自动选择季节
      this.autoSelectSeason();

      console.log('[季节效果] 已启动');
    },

    /**
     * 自动选择季节
     */
    autoSelectSeason() {
      if (!effectSettingEnabled('seasonEffects')) {
        this.stopEffect();
        return;
      }
      const month = new Date().getMonth() + 1;

      if (month >= 3 && month <= 5) {
        this.startEffect('spring'); // 春天
      } else if (month >= 6 && month <= 8) {
        this.startEffect('summer'); // 夏天
      } else if (month >= 9 && month <= 11) {
        this.startEffect('autumn'); // 秋天
      } else {
        this.startEffect('winter'); // 冬天
      }
    },

    /**
     * 启动特定效果
     */
    startEffect(type) {
      if (!effectSettingEnabled('seasonEffects')) {
        this.stopEffect();
        return;
      }
      this.stopEffect();
      this.currentEffect = type;

      switch(type) {
        case 'spring':
          this.createCherryBlossoms();
          break;
        case 'summer':
          this.createFireflies();
          break;
        case 'autumn':
          this.createFallingLeaves();
          break;
        case 'winter':
          this.createSnowflakes();
          break;
        case 'rain':
          this.createRain();
          break;
      }
    },

    /**
     * 停止当前效果
     */
    stopEffect() {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      this.particles.forEach(p => p.remove());
      this.particles = [];
      this.currentEffect = null;
    },

    /**
     * 春天 - 樱花飘落
     */
    createCherryBlossoms() {
      const createPetal = () => {
        if (this.currentEffect !== 'spring') return;
        if (this.particles.length >= this.maxParticles) return;

        const petal = document.createElement('div');
        const size = 8 + Math.random() * 8;
        const startX = Math.random() * window.innerWidth;
        const duration = 8 + Math.random() * 8;
        const delay = Math.random() * 5;
        const swing = 50 + Math.random() * 100;

        petal.className = 'season-particle cherry-blossom';
        petal.textContent = '🌸';
        petal.style.cssText = `
          position: fixed;
          left: ${startX}px;
          top: -20px;
          font-size: ${size}px;
          pointer-events: none;
          z-index: 1;
          opacity: 0.8;
          animation: cherryFall ${duration}s linear ${delay}s infinite;
          --swing: ${swing}px;
        `;

        document.body.appendChild(petal);
        this.particles.push(petal);
      };

      // 初始创建
      for (let i = 0; i < 20; i++) {
        setTimeout(() => createPetal(), i * 300);
      }

      // 持续创建
      const interval = setInterval(() => {
        if (this.currentEffect !== 'spring') {
          clearInterval(interval);
          return;
        }
        createPetal();
      }, 2000);
    },

    /**
     * 夏天 - 萤火虫
     */
    createFireflies() {
      const createFirefly = () => {
        if (this.currentEffect !== 'summer') return;
        if (this.particles.length >= 30) return;

        const firefly = document.createElement('div');
        const size = 3 + Math.random() * 3;
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight / 2 + Math.random() * (window.innerHeight / 2);
        const duration = 5 + Math.random() * 5;

        firefly.className = 'season-particle firefly';
        firefly.style.cssText = `
          position: fixed;
          left: ${startX}px;
          top: ${startY}px;
          width: ${size}px;
          height: ${size}px;
          background: #ffeb3b;
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
          box-shadow: 0 0 10px #ffeb3b, 0 0 20px #ffeb3b;
          animation: fireflyFloat ${duration}s ease-in-out infinite;
        `;

        document.body.appendChild(firefly);
        this.particles.push(firefly);
      };

      // 初始创建
      for (let i = 0; i < 15; i++) {
        setTimeout(() => createFirefly(), i * 200);
      }

      // 持续创建
      const interval = setInterval(() => {
        if (this.currentEffect !== 'summer') {
          clearInterval(interval);
          return;
        }
        if (this.particles.length < 30) {
          createFirefly();
        }
      }, 3000);
    },

    /**
     * 秋天 - 落叶
     */
    createFallingLeaves() {
      const leafEmojis = ['🍂', '🍁'];

      const createLeaf = () => {
        if (this.currentEffect !== 'autumn') return;
        if (this.particles.length >= this.maxParticles) return;

        const leaf = document.createElement('div');
        const size = 12 + Math.random() * 12;
        const startX = Math.random() * window.innerWidth;
        const duration = 10 + Math.random() * 10;
        const delay = Math.random() * 5;
        const swing = 80 + Math.random() * 120;
        const emoji = leafEmojis[Math.floor(Math.random() * leafEmojis.length)];

        leaf.className = 'season-particle falling-leaf';
        leaf.textContent = emoji;
        leaf.style.cssText = `
          position: fixed;
          left: ${startX}px;
          top: -30px;
          font-size: ${size}px;
          pointer-events: none;
          z-index: 1;
          opacity: 0.9;
          animation: leafFall ${duration}s ease-in ${delay}s infinite;
          --swing: ${swing}px;
        `;

        document.body.appendChild(leaf);
        this.particles.push(leaf);
      };

      // 初始创建
      for (let i = 0; i < 25; i++) {
        setTimeout(() => createLeaf(), i * 400);
      }

      // 持续创建
      const interval = setInterval(() => {
        if (this.currentEffect !== 'autumn') {
          clearInterval(interval);
          return;
        }
        createLeaf();
      }, 2500);
    },

    /**
     * 冬天 - 雪花
     */
    createSnowflakes() {
      const createSnowflake = () => {
        if (this.currentEffect !== 'winter') return;
        if (this.particles.length >= this.maxParticles) return;

        const snowflake = document.createElement('div');
        const size = 10 + Math.random() * 15;
        const startX = Math.random() * window.innerWidth;
        const duration = 8 + Math.random() * 10;
        const delay = Math.random() * 5;
        const swing = 30 + Math.random() * 60;

        snowflake.className = 'season-particle snowflake';
        snowflake.textContent = '❄️';
        snowflake.style.cssText = `
          position: fixed;
          left: ${startX}px;
          top: -30px;
          font-size: ${size}px;
          pointer-events: none;
          z-index: 1;
          opacity: 0.9;
          animation: snowFall ${duration}s linear ${delay}s infinite;
          --swing: ${swing}px;
        `;

        document.body.appendChild(snowflake);
        this.particles.push(snowflake);
      };

      // 初始创建
      for (let i = 0; i < 30; i++) {
        setTimeout(() => createSnowflake(), i * 300);
      }

      // 持续创建
      const interval = setInterval(() => {
        if (this.currentEffect !== 'winter') {
          clearInterval(interval);
          return;
        }
        createSnowflake();
      }, 2000);
    },

    /**
     * 下雨模式
     */
    createRain() {
      const createRaindrop = () => {
        if (this.currentEffect !== 'rain') return;
        if (this.particles.length >= 100) return;

        const drop = document.createElement('div');
        const startX = Math.random() * window.innerWidth;
        const duration = 0.5 + Math.random() * 0.5;

        drop.className = 'season-particle raindrop';
        drop.style.cssText = `
          position: fixed;
          left: ${startX}px;
          top: -10px;
          width: 2px;
          height: 20px;
          background: linear-gradient(to bottom, transparent, rgba(174, 194, 224, 0.8));
          pointer-events: none;
          z-index: 1;
          animation: rainFall ${duration}s linear infinite;
        `;

        document.body.appendChild(drop);
        this.particles.push(drop);

        setTimeout(() => {
          drop.remove();
          const index = this.particles.indexOf(drop);
          if (index > -1) this.particles.splice(index, 1);
        }, duration * 1000);
      };

      // 快速创建雨滴
      const interval = setInterval(() => {
        if (this.currentEffect !== 'rain') {
          clearInterval(interval);
          return;
        }
        for (let i = 0; i < 5; i++) {
          createRaindrop();
        }
      }, 100);
    }
  };

  // 添加CSS动画
  const style = document.createElement('style');
  style.textContent = `
    /* 樱花飘落 */
    @keyframes cherryFall {
      0% {
        transform: translateY(0) translateX(0) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 0.8;
      }
      90% {
        opacity: 0.8;
      }
      100% {
        transform: translateY(100vh) translateX(var(--swing)) rotate(360deg);
        opacity: 0;
      }
    }

    /* 萤火虫飘动 */
    @keyframes fireflyFloat {
      0%, 100% {
        transform: translate(0, 0);
        opacity: 0.3;
      }
      25% {
        transform: translate(30px, -40px);
        opacity: 1;
      }
      50% {
        transform: translate(-20px, -60px);
        opacity: 0.5;
      }
      75% {
        transform: translate(40px, -30px);
        opacity: 1;
      }
    }

    /* 落叶飘落 */
    @keyframes leafFall {
      0% {
        transform: translateY(0) translateX(0) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 0.9;
      }
      90% {
        opacity: 0.9;
      }
      100% {
        transform: translateY(100vh) translateX(var(--swing)) rotate(720deg);
        opacity: 0;
      }
    }

    /* 雪花飘落 */
    @keyframes snowFall {
      0% {
        transform: translateY(0) translateX(0) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 0.9;
      }
      90% {
        opacity: 0.9;
      }
      100% {
        transform: translateY(100vh) translateX(var(--swing)) rotate(360deg);
        opacity: 0;
      }
    }

    /* 雨滴下落 */
    @keyframes rainFall {
      to {
        transform: translateY(100vh);
      }
    }

    /* 移动端优化 - 减少粒子 */
    @media (max-width: 768px) {
      .season-particle:nth-child(n+15) {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);

  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SeasonEffects.init());
  } else {
    SeasonEffects.init();
  }

  // 导出到全局
  window.MathCampSeasonEffects = SeasonEffects;

})();
