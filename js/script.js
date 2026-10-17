document.addEventListener("DOMContentLoaded", () => {

  // =====================================================
  // 1. MOBILE MENU
  // =====================================================
  const menuBtn = document.getElementById("menuBtn");
  const navMenu = document.getElementById("navMenu");

  menuBtn?.addEventListener("click", () => {
    navMenu.classList.toggle("hidden");
    navMenu.classList.toggle("flex");

    const isOpen = !navMenu.classList.contains("hidden");

    menuBtn.setAttribute("aria-expanded", String(isOpen));
    menuBtn.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
  });

  // =====================================================
  // 2. RECIPES: search + category filter
  // =====================================================
  const searchInput = document.querySelector("#searchInput");
  const categoryFilter = document.querySelector("#mealtype");
  const recipeCards = [...document.querySelectorAll("[data-recipe-card]")];

  function filterRecipes() {
    if (!recipeCards.length) return;

    const query = (searchInput?.value || "").toLowerCase().trim();
    const category = categoryFilter?.value || "all";
    let shown = 0;

    recipeCards.forEach(card => {
      const searchable = `${card.dataset.name || ""} ${card.dataset.ingredients || ""}`.toLowerCase();

      const matchesSearch = searchable.includes(query);
      const matchesCategory = category === "all" || card.dataset.category === category;
      const matches = matchesSearch && matchesCategory;

      card.hidden = !matches;
      if (matches) shown++;
    });

    const count = document.querySelector("#resultsCount");
    if (count) count.textContent = `${shown} recipe${shown === 1 ? "" : "s"} found`;

    const empty = document.querySelector("#noResults");
    if (empty) empty.hidden = shown !== 0;
  }

  searchInput?.addEventListener("input", filterRecipes);
  categoryFilter?.addEventListener("change", filterRecipes);
  filterRecipes();

  // =====================================================
  // 3. RECIPE MODAL
  // =====================================================
  const modal = document.querySelector("#recipeModal");

  function openModal() {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = "";
  }

  // Turn "a|b|c" into list items inside a <ul> or <ol>.
  function fillList(listEl, text) {
    listEl.innerHTML = "";
    (text || "").split("|").forEach(item => {
      if (!item.trim()) return;
      const li = document.createElement("li");
      li.textContent = item.trim();
      listEl.appendChild(li);
    });
  }

  document.querySelectorAll("[data-open-recipe]").forEach(button => {
    button.addEventListener("click", () => {
      if (!modal) return;
      const data = button.closest("[data-recipe-card]");
      if (!data) return;

      document.querySelector("#modalTitle").textContent = data.dataset.name;
      document.querySelector("#modalCost").textContent = `Estimated ulam cost: ₱${data.dataset.price} per serving`;
      fillList(document.querySelector("#modalIngredients"), data.dataset.ingredientsList);
      fillList(document.querySelector("#modalSteps"), data.dataset.steps);
      document.querySelector("#modalNote").textContent =
        data.dataset.note || "Prices are estimates and vary by store and location.";

      openModal();
    });
  });

  document.querySelector("#closeRecipeModal")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", event => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

  // =====================================================
  // 4. CAROUSEL
  // =====================================================
  const carouselImages = document.querySelectorAll(".carousel-image");
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  let currentImage = 0;

  function showImage(index) {
    carouselImages.forEach((image, i) => {
      image.classList.toggle("hidden", i !== index);
    });
  }

  if (carouselImages.length > 0 && nextBtn && prevBtn) {
    nextBtn.addEventListener("click", () => {
      currentImage = (currentImage + 1) % carouselImages.length;
      showImage(currentImage);
    });

    prevBtn.addEventListener("click", () => {
      currentImage = (currentImage - 1 + carouselImages.length) % carouselImages.length;
      showImage(currentImage);
    });

    showImage(currentImage);
  }

  // =====================================================
  // 5. BUDGET PLANNER (only runs on budget_planner.html)
  // =====================================================
  const addMealBtn = document.querySelector("#addMealBtn");
  const updateBudgetBtn = document.querySelector("#updateBudgetBtn");

  if (addMealBtn && updateBudgetBtn) {
    const STORAGE_KEY = "mealmateBudget";

    const mealName = document.querySelector("#mealName");
    const mealIngredients = document.querySelector("#mealIngredients");
    const mealCost = document.querySelector("#mealCost");
    const mealError = document.querySelector("#mealError");
    const mealList = document.querySelector("#mealList");
    const mealsEmpty = document.querySelector("#mealsEmpty");
    const mealsTotalEl = document.querySelector("#mealsTotal");

    const totalBudgetInput = document.querySelector("#totalBudget");
    const spentAmountInput = document.querySelector("#spentAmount");
    const budgetError = document.querySelector("#budgetError");
    const totalOutput = document.querySelector("#totalOutput");
    const spentOutput = document.querySelector("#spentOutput");
    const remainingOutput = document.querySelector("#remainingOutput");
    const progress = document.querySelector("#budgetProgress");
    const message = document.querySelector("#budgetMessage");

    // The "wallet": everything the page remembers
    let state = { budget: 0, extraSpent: 0, meals: [] };

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        state = {
          budget: Number(saved.budget) || 0,
          extraSpent: Number(saved.extraSpent) || 0,
          meals: Array.isArray(saved.meals) ? saved.meals : []
        };
      }
    } catch (e) { /* start fresh */ }

    function save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }

    function peso(n) {
      return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function mealsTotal() {
      return state.meals.reduce((sum, m) => sum + m.cost, 0);
    }

    function showError(el, text) {
      el.textContent = text;
      el.hidden = !text;
    }

    function renderMeals() {
      mealList.innerHTML = "";
      mealsEmpty.hidden = state.meals.length > 0;
      mealsTotalEl.textContent = peso(mealsTotal());

      state.meals.forEach((meal, index) => {
        const li = document.createElement("li");
        li.className = "flex items-start justify-between gap-3 rounded-2xl bg-orange-50 p-3";

        const info = document.createElement("div");
        const title = document.createElement("p");
        title.className = "font-semibold text-amber-950";
        title.textContent = meal.name;
        const sub = document.createElement("p");
        sub.className = "text-sm text-slate-600";
        sub.textContent = meal.ingredients || "No ingredients listed";
        info.append(title, sub);

        const right = document.createElement("div");
        right.className = "text-right shrink-0";
        const price = document.createElement("p");
        price.className = "font-bold text-amber-900";
        price.textContent = peso(meal.cost);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "text-sm text-red-600 hover:underline cursor-pointer";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => {
          state.meals.splice(index, 1);
          save();
          renderAll();
        });
        right.append(price, remove);

        li.append(info, right);
        mealList.appendChild(li);
      });
    }

    function renderTracker() {
      const budget = state.budget;
      const spent = state.extraSpent + mealsTotal();
      const remaining = budget - spent;

      totalOutput.textContent = peso(budget);
      spentOutput.textContent = peso(spent);
      remainingOutput.textContent = peso(remaining);
      remainingOutput.style.color = remaining < 0 ? "#dc2626" : "";

      if (budget <= 0) {
        progress.style.width = "0%";
        message.textContent = "Set your budget to get started.";
        message.style.color = "";
        return;
      }

      const percent = (spent / budget) * 100;
      progress.style.width = Math.min(percent, 100) + "%";

      if (percent > 100) {
        progress.style.backgroundColor = "#dc2626";
        message.textContent = `You're over budget by ${peso(Math.abs(remaining))}. Try cheaper meals!`;
        message.style.color = "#dc2626";
      } else if (percent >= 80) {
        progress.style.backgroundColor = "#ea580c";
        message.textContent = `Careful! You've used ${Math.round(percent)}% of your budget. ${peso(remaining)} left.`;
        message.style.color = "#c2410c";
      } else {
        progress.style.backgroundColor = "#16a34a";
        message.textContent = `You're on track! ${peso(remaining)} left (${Math.round(percent)}% used).`;
        message.style.color = "#15803d";
      }
    }

    function renderAll() {
      renderMeals();
      renderTracker();
    }

    // Button: Calculate & Add Meal
    addMealBtn.addEventListener("click", () => {
      const name = mealName.value.trim();
      const ingredients = mealIngredients.value.trim();
      const cost = parseFloat(mealCost.value);

      if (!name) return showError(mealError, "Please enter the meal name.");
      if (isNaN(cost) || cost <= 0) return showError(mealError, "Please enter a cost greater than 0.");

      showError(mealError, "");
      state.meals.push({ name, ingredients, cost });
      save();

      mealName.value = "";
      mealIngredients.value = "";
      mealCost.value = "";
      mealName.focus();

      renderAll();
    });

    // Button: Update Budget
    updateBudgetBtn.addEventListener("click", () => {
      const budget = parseFloat(totalBudgetInput.value) || 0;
      const extra = parseFloat(spentAmountInput.value) || 0;

      if (budget < 0 || extra < 0) return showError(budgetError, "Amounts can't be negative.");

      showError(budgetError, "");
      state.budget = budget;
      state.extraSpent = extra;
      save();
      renderAll();
    });

    // Press Enter inside the inputs
    [mealName, mealIngredients, mealCost].forEach(el =>
      el.addEventListener("keydown", e => { if (e.key === "Enter") addMealBtn.click(); })
    );
    [totalBudgetInput, spentAmountInput].forEach(el =>
      el.addEventListener("keydown", e => { if (e.key === "Enter") updateBudgetBtn.click(); })
    );

    // Restore saved values and draw everything
    if (state.budget) totalBudgetInput.value = state.budget;
    if (state.extraSpent) spentAmountInput.value = state.extraSpent;
    renderAll();
  }
});