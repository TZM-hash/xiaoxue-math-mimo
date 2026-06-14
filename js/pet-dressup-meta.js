(function () {
  "use strict";

  function matchesReward(kind, id, reward = {}) {
    if (kind === "theme") return reward.roomTheme === id;
    if (kind === "furniture") return reward.furniture === id || reward.decoration === id;
    if (kind === "outfit") return reward.outfit === id;
    return false;
  }

  function sourceLabels(kind, item = {}, sources = {}) {
    const id = item.id;
    const labels = [];
    (sources.levelRewards || []).forEach((reward) => {
      if (matchesReward(kind, id, reward)) labels.push(`Lv.${reward.level} 成长礼物`);
    });
    (sources.storyChapters || []).forEach((chapter) => {
      if (matchesReward(kind, id, chapter)) labels.push(`剧情：${chapter.title}`);
    });
    (sources.achievements || []).forEach((achievement) => {
      if (matchesReward(kind, id, achievement)) labels.push(`成就：${achievement.title}`);
    });
    const price = Math.max(0, Number(item.price) || 0);
    if (price > 0) labels.push(`${price} 金币购买`);
    if (!labels.length && Number(item.minLevel || 1) > 1) labels.push(`Lv.${Number(item.minLevel || 1)} 开放`);
    if (!labels.length) labels.push("默认可用");
    return labels;
  }

  function unlockSourceText(kind, item, sources) {
    return `解锁来源：${sourceLabels(kind, item, sources).join(" / ")}`;
  }

  function unlockProgressText(kind, item = {}, pet = {}, sources = {}) {
    const owned = Boolean(
      kind === "theme" ? pet.unlockedThemes?.[item.id]
        : kind === "furniture" ? pet.ownedFurniture?.[item.id]
          : pet.outfits?.[item.id]
    );
    if (owned) return "已拥有，可在装扮馆切换使用";

    const minLevel = Number(item.minLevel || 1);
    const level = Number(pet.level || 1);
    if (level < minLevel) return `进度：Lv.${level}/${minLevel}，还差 ${minLevel - level} 级`;

    const price = Math.max(0, Number(item.price) || 0);
    if (price > 0) {
      const coins = Number(pet.coins || 0);
      return coins >= price ? `进度：金币足够，可购买` : `进度：还差 ${price - coins} 金币`;
    }

    const hasNonShopSource = sourceLabels(kind, item, sources).some((label) => !label.includes("购买") && label !== "默认可用");
    return hasNonShopSource ? "进度：通过对应奖励领取" : "进度：已开放";
  }

  window.MathCampPetDressupMeta = { unlockSourceText, unlockProgressText };
})();
