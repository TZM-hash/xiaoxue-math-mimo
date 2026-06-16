/**
 * 喵喵数学 - 光标特效系统
 * 包含：粒子尾迹、点击爆炸、光标变形、磁吸效果
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

  const CursorEffects = {
    enabled: effectSettingEnabled('cursorEffects'),
    initialized: false,
    particles: [],
    maxParticles: 50,
    lastMousePos: { x: 0, y: 0 },
    lastClickTime: 0,
    lastClickPos: { x: 0, y: 0 },

    init() {
      this.enabled = effectSettingEnabled('cursorEffects');
      if (!this.enabled) return;
      if (this.initialized) return;
      this.initialized = true;

      this.setupParticleTrail();
      this.setupClickExplosion();
      this.setupCustomCursor();
      this.setupMagneticEffect();

      console.log('[光标特效] 已启动');
    },

    /**
     * 粒子尾迹
     */
    setupParticleTrail() {
      let lastEmitTime = 0;
      const emitInterval = 30; // 每30ms发射一个粒子

      document.addEventListener('mousemove', (e) => {
        if (!this.enabled) return;
        this.lastMousePos = { x: e.clientX, y: e.clientY };

        const now = Date.now();
        if (now - lastEmitTime < emitInterval) return;
        lastEmitTime = now;

        this.createTrailParticle(e.clientX, e.clientY);
      });
    },

    createTrailParticle(x, y) {
      if (!this.enabled) return;
      if (this.particles.length >= this.maxParticles) {
        const old = this.particles.shift();
        old?.remove();
      }

      const particle = document.createElement('div');
      const size = 4 + Math.random() * 4;
      const colors = ['#ffd700', '#ff69b4', '#87ceeb', '#98fb98', '#dda0dd'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      particle.className = 'cursor-trail-particle';
      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        opacity: 0.8;
        animation: cursorTrailFade 0.8s ease-out forwards;
        box-shadow: 0 0 10px ${color};
      `;

      document.body.appendChild(particle);
      this.particles.push(particle);

      setTimeout(() => {
        particle.remove();
        const index = this.particles.indexOf(particle);
        if (index > -1) this.particles.splice(index, 1);
      }, 800);
    },

    /**
     * 点击爆炸特效 - 只在交互元素上触发
     */
    setupClickExplosion() {
      document.addEventListener('click', (e) => {
        if (!this.enabled) return;
        // 只在可交互元素上触发特效，排除模态框背景
        const isInteractive = e.target.closest('button, a, input, select, textarea, .clickable, .card, .tab-btn, .home-mode-card, .home-mode-card-wrap');
        const isModalBackdrop = e.target.classList.contains('hub-modal') ||
                                 e.target.classList.contains('pet-modal') ||
                                 e.target.classList.contains('archive-modal');

        if (isInteractive && !isModalBackdrop) {
          const now = Date.now();
          const pos = { x: e.clientX, y: e.clientY };

          // 防止同一次点击触发多次特效（50ms内同一位置）
          const timeDiff = now - this.lastClickTime;
          const posDiff = Math.abs(pos.x - this.lastClickPos.x) + Math.abs(pos.y - this.lastClickPos.y);

          if (timeDiff > 50 || posDiff > 5) {
            this.createClickExplosion(pos.x, pos.y);
            this.lastClickTime = now;
            this.lastClickPos = pos;
          }
        }
      });
    },

    createClickExplosion(x, y) {
      if (!this.enabled) return;
      const particleCount = 12;
      const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731'];

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 50 + Math.random() * 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        this.createExplosionParticle(x, y, vx, vy, colors[i % colors.length]);
      }

      // 中心光环
      this.createRipple(x, y);
    },

    createExplosionParticle(x, y, vx, vy, color) {
      if (!this.enabled) return;
      const particle = document.createElement('div');
      const size = 6 + Math.random() * 6;

      particle.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        animation: cursorExplosion 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        --vx: ${vx}px;
        --vy: ${vy}px;
        box-shadow: 0 0 10px ${color};
      `;

      document.body.appendChild(particle);

      setTimeout(() => particle.remove(), 600);
    },

    createRipple(x, y) {
      if (!this.enabled) return;
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 20px;
        height: 20px;
        border: 2px solid #ffd700;
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        transform: translate(-50%, -50%);
        animation: cursorRipple 0.6s ease-out forwards;
      `;

      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    },

    /**
     * 自定义光标
     */
    setupCustomCursor() {
      const cursor = document.createElement('div');
      cursor.id = 'customCursor';
      cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border: 2px solid var(--accent);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
        transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        mix-blend-mode: difference;
        opacity: 0;
      `;

      document.body.appendChild(cursor);

      // 光标跟随
      document.addEventListener('mousemove', (e) => {
        if (!this.enabled) return;
        cursor.style.opacity = '1';
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      });

      // 悬停交互元素时变大
      document.addEventListener('mouseover', (e) => {
        if (!this.enabled) return;
        if (e.target.closest('button, a, .home-mode-card, .tab-btn, input, select')) {
          cursor.style.width = '40px';
          cursor.style.height = '40px';
          cursor.style.background = 'rgba(58, 164, 124, 0.1)';
        }
      });

      document.addEventListener('mouseout', (e) => {
        if (!this.enabled) return;
        if (e.target.closest('button, a, .home-mode-card, .tab-btn, input, select')) {
          cursor.style.width = '20px';
          cursor.style.height = '20px';
          cursor.style.background = 'transparent';
        }
      });

      // 点击时缩小
      document.addEventListener('mousedown', () => {
        if (!this.enabled) return;
        cursor.style.width = '16px';
        cursor.style.height = '16px';
      });

      document.addEventListener('mouseup', () => {
        if (!this.enabled) return;
        cursor.style.width = '20px';
        cursor.style.height = '20px';
      });
    },

    /**
     * 磁吸效果
     */
    setupMagneticEffect() {
      const magneticElements = document.querySelectorAll('button.primary, .home-mode-card');

      magneticElements.forEach(element => {
        element.addEventListener('mousemove', (e) => {
          if (!this.enabled) return;
          const rect = element.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          const deltaX = (e.clientX - centerX) * 0.15;
          const deltaY = (e.clientY - centerY) * 0.15;

          element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        });

        element.addEventListener('mouseleave', () => {
          if (!this.enabled) return;
          element.style.transform = 'translate(0, 0)';
        });
      });

      // 动态监听新增元素
      const observer = new MutationObserver(() => {
        const newElements = document.querySelectorAll('button.primary:not([data-magnetic]), .home-mode-card:not([data-magnetic])');
        newElements.forEach(element => {
          element.setAttribute('data-magnetic', 'true');
          // 重新绑定事件
          this.setupMagneticEffect();
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    },

    /**
     * 禁用光标特效
     */
    disable() {
      this.enabled = false;
      this.particles.forEach(p => p.remove());
      this.particles = [];
      document.getElementById('customCursor')?.remove();
      console.log('[光标特效] 已禁用');
    }
  };

  // 添加CSS动画
  const style = document.createElement('style');
  style.textContent = `
    @keyframes cursorTrailFade {
      0% {
        opacity: 0.8;
        transform: translate(-50%, -50%) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5) translateY(-20px);
      }
    }

    @keyframes cursorExplosion {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%) translate(0, 0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) translate(var(--vx), var(--vy)) scale(0.2);
      }
    }

    @keyframes cursorRipple {
      0% {
        opacity: 0.8;
        transform: translate(-50%, -50%) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(4);
      }
    }

    /* 磁吸元素平滑过渡 */
    [data-magnetic] {
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }

    /* 移动端禁用 */
    @media (max-width: 768px), (pointer: coarse) {
      #customCursor,
      .cursor-trail-particle {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  // 页面加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CursorEffects.init());
  } else {
    CursorEffects.init();
  }

  // 导出到全局
  window.MathCampCursorEffects = CursorEffects;

})();
