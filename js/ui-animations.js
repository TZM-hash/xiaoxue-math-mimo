/**
 * 喵喵数学 - UI 动画增强系统
 * 提供各种视觉反馈和动画效果
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

  const UIAnimations = {
    enabled: effectSettingEnabled('uiAnimations'),

    /**
     * 初始化动画系统
     */
    init() {
      if (!this.enabled) {
        document.documentElement.classList.add('effects-ui-animations-off');
        return;
      }
      this.setupRippleEffects();
      this.setupCardAnimations();
      this.setupNumberCounters();
      this.setupParticleSystem();
      this.setupPageTransitions();
      console.log('[UI动画] 动画系统已加载');
    },

    /**
     * 按钮涟漪效果
     */
    setupRippleEffects() {
      document.addEventListener('click', (e) => {
        if (!this.enabled) return;
        const target = e.target.closest('button, .tab-btn, .home-mode-card');
        if (!target) return;

        const ripple = document.createElement('span');
        const rect = target.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          pointer-events: none;
          animation: ripple 0.6s ease-out;
          z-index: 1;
        `;

        target.style.position = 'relative';
        target.style.overflow = 'hidden';
        target.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      });
    },

    /**
     * 卡片进入动画
     */
    setupCardAnimations() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0) scale(1)';
            }, index * 100);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      // 观察需要动画的元素
      const animateElements = [
        '.home-settings-card',
        '.today-plan-card',
        '.home-pet-card',
        '.challenge-panel',
        '.home-mode-card'
      ];

      setTimeout(() => {
        animateElements.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px) scale(0.95)';
            el.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            observer.observe(el);
          });
        });
      }, 100);
    },

    /**
     * 数字滚动动画
     */
    animateNumber(element, start, end, duration = 600) {
      if (!element) return;

      const startTime = performance.now();
      const range = end - start;

      const updateNumber = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用缓动函数
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + range * easeOutQuart);

        element.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          element.textContent = end;
        }
      };

      requestAnimationFrame(updateNumber);
    },

    /**
     * 设置数字计数器
     */
    setupNumberCounters() {
      // 监听统计数据变化
      const statObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const target = mutation.target.tagName === 'STRONG'
              ? mutation.target
              : mutation.target.closest('strong');

            if (target && target.closest('.stat')) {
              target.closest('.stat')?.classList.add('updated');
              setTimeout(() => {
                target.closest('.stat')?.classList.remove('updated');
              }, 500);
            }
          }
        });
      });

      // 观察所有统计元素
      setTimeout(() => {
        document.querySelectorAll('.stat strong').forEach(el => {
          statObserver.observe(el, {
            childList: true,
            characterData: true,
            subtree: true
          });
        });
      }, 1000);
    },

    /**
     * 粒子系统
     */
    setupParticleSystem() {
      this.particlePool = [];
    },

    /**
     * 创建星星爆炸效果
     */
    createStarBurst(x, y, count = 12, color = '#ffd700') {
      if (!this.enabled || !effectSettingEnabled('rewardParticles')) return;
      const container = document.createElement('div');
      container.className = 'star-burst';
      container.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
      `;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const distance = 60 + Math.random() * 40;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const size = 8 + Math.random() * 8;

        const particle = document.createElement('div');
        particle.className = 'star-particle';
        particle.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          --tx: ${tx}px;
          --ty: ${ty}px;
        `;

        container.appendChild(particle);
      }

      document.body.appendChild(container);
      setTimeout(() => container.remove(), 800);
    },

    /**
     * 创建金币飞入动画
     */
    createCoinFly(startX, startY, targetElement, count = 5) {
      if (!this.enabled || !effectSettingEnabled('rewardParticles')) return;
      if (!targetElement) return;

      const targetRect = targetElement.getBoundingClientRect();
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;

      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const coin = document.createElement('div');
          coin.className = 'coin-particle';
          coin.textContent = '💰';
          coin.style.cssText = `
            left: ${startX}px;
            top: ${startY}px;
            font-size: 24px;
            --target-x: ${targetX - startX}px;
            --target-y: ${targetY - startY}px;
          `;

          document.body.appendChild(coin);
          setTimeout(() => coin.remove(), 1000);
        }, i * 100);
      }

      // 目标元素闪烁
      targetElement.style.transition = 'transform 0.3s';
      setTimeout(() => {
        targetElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
          targetElement.style.transform = 'scale(1)';
        }, 200);
      }, count * 100);
    },

    /**
     * 创建彩虹轨迹
     */
    createRainbowTrail(x, y) {
      if (!this.enabled || !effectSettingEnabled('rewardParticles')) return;
      const trail = document.createElement('div');
      trail.className = 'rainbow-trail';
      trail.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: 20px;
        height: 20px;
      `;

      document.body.appendChild(trail);
      setTimeout(() => trail.remove(), 600);
    },

    /**
     * 答题正确动画
     */
    celebrateCorrect(element) {
      if (!this.enabled) return;
      if (!element) return;

      // 添加庆祝类
      element.classList.add('feedback-correct');
      setTimeout(() => element.classList.remove('feedback-correct'), 600);

      // 创建星星爆炸
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      this.createStarBurst(x, y, 15, '#4ade80');

      // 添加成功音效触发点
      element.dispatchEvent(new CustomEvent('correct-animation'));
    },

    /**
     * 答题错误动画
     */
    showWrongFeedback(element) {
      if (!this.enabled) return;
      if (!element) return;

      element.classList.add('feedback-wrong');
      setTimeout(() => element.classList.remove('feedback-wrong'), 500);

      // 添加错误音效触发点
      element.dispatchEvent(new CustomEvent('wrong-animation'));
    },

    /**
     * 成就解锁动画
     */
    showAchievement(title, description, icon = '🏆') {
      if (!this.enabled || !effectSettingEnabled('rewardParticles')) return;
      const achievement = document.createElement('div');
      achievement.className = 'achievement-badge';
      achievement.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) scale(0);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 15px;
        font-weight: bold;
        max-width: 400px;
      `;

      achievement.innerHTML = `
        <div style="font-size: 48px;">${icon}</div>
        <div>
          <div style="font-size: 20px; margin-bottom: 5px;">${title}</div>
          <div style="font-size: 14px; opacity: 0.9;">${description}</div>
        </div>
      `;

      document.body.appendChild(achievement);

      // 进入动画
      setTimeout(() => {
        achievement.style.transform = 'translateX(-50%) scale(1)';
        achievement.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }, 50);

      // 星星爆炸
      setTimeout(() => {
        const rect = achievement.getBoundingClientRect();
        this.createStarBurst(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          20,
          '#ffd700'
        );
      }, 400);

      // 移除
      setTimeout(() => {
        achievement.style.transform = 'translateX(-50%) scale(0) translateY(-50px)';
        achievement.style.opacity = '0';
        setTimeout(() => achievement.remove(), 500);
      }, 4000);
    },

    /**
     * 页面切换动画
     */
    setupPageTransitions() {
      // 监听视图切换
      const viewObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const target = mutation.target;
            if (target.classList.contains('active') && target.classList.contains('view')) {
              // 视图激活时添加进入动画
              target.style.animation = 'fadeInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            }
          }
        });
      });

      setTimeout(() => {
        document.querySelectorAll('.view').forEach(view => {
          viewObserver.observe(view, { attributes: true });
        });
      }, 500);
    },

    /**
     * 添加悬浮气泡背景
     */
    addFloatingBubbles(count = 10) {
      if (!this.enabled || !effectSettingEnabled('ambientAnimations')) return;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const bubble = document.createElement('div');
          const size = 30 + Math.random() * 70;
          const left = Math.random() * 100;
          const duration = 15 + Math.random() * 10;
          const delay = Math.random() * 5;

          bubble.className = 'bubble';
          bubble.style.cssText = `
            left: ${left}%;
            width: ${size}px;
            height: ${size}px;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
          `;

          document.body.appendChild(bubble);

          // 动画结束后重新创建
          setTimeout(() => {
            bubble.remove();
            this.addFloatingBubbles(1);
          }, (duration + delay) * 1000);
        }, i * 500);
      }
    },

    /**
     * 为元素添加3D倾斜效果
     */
    add3DTiltEffect(element) {
      if (!this.enabled) return;
      if (!element) return;

      element.style.transformStyle = 'preserve-3d';
      element.style.transition = 'transform 0.3s ease';

      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
      });
    },

    /**
     * 进度条流光动画
     */
    addProgressShimmer(progressBar) {
      if (!this.enabled || !effectSettingEnabled('ambientAnimations')) return;
      if (!progressBar) return;
      progressBar.classList.add('progress-bar');
    },

    /**
     * 骨架屏加载
     */
    createSkeleton(container, type = 'card') {
      if (!container) return;

      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton';

      if (type === 'card') {
        skeleton.style.cssText = 'width: 100%; height: 200px;';
      } else if (type === 'text') {
        skeleton.style.cssText = 'width: 100%; height: 20px; margin: 10px 0;';
      }

      container.appendChild(skeleton);
      return skeleton;
    },

    /**
     * 玻璃态卡片
     */
    makeGlassCard(element) {
      if (!element) return;
      element.classList.add('glass-card');
    },

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
      document.documentElement.classList.toggle('effects-ui-animations-off', !this.enabled);
      if (!this.enabled) {
        document.querySelectorAll('.star-burst, .coin-particle, .rainbow-trail, .achievement-badge').forEach(el => el.remove());
      }
    }
  };

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      UIAnimations.init();
      // 添加浮动气泡（可选）
      // UIAnimations.addFloatingBubbles(8);
    });
  } else {
    UIAnimations.init();
    // UIAnimations.addFloatingBubbles(8);
  }

  // 导出到全局
  window.MathCampUIAnimations = UIAnimations;

})();
