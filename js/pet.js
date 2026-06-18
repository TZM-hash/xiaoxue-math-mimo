(function () {
  function taskState(deps, profile, task, period) {
    var pet = deps.petState(profile);
    var key = period === "weekly" ? deps.currentWeekKey() : deps.todayKey();
    var bucket = (pet.tasks && pet.tasks[period]) || {};
    var done = deps.clamp(Number(task.progress(profile)) || 0, 0, 999);
    var target = Math.max(1, Number(task.target) || 1);
    var claimed = bucket[task.id] === key;
    return { ...task, period: period, key: key, done: done, target: target, complete: done >= target, claimed: claimed };
  }

  window.MathCampPet = {
    taskState: taskState
  };
})();
