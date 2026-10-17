document.addEventListener("DOMContentLoaded", () => {

  // ---------- Search + category filter ----------
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

  // ---------- Recipe modal ----------
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
});