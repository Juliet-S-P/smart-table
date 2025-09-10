import "./fonts/ys-display/fonts.css";
import "./style.css";
import { data as sourceData } from "./data/dataset_1.js";
import { initData } from "./data.js";
import { processFormData } from "./lib/utils.js";
import { initTable } from "./components/table.js";
import { initPagination } from "./components/pagination.js";
import { initSorting } from "./components/sorting.js";
import { initFiltering } from "./components/filtering.js";
import { initSearching } from "./components/searching.js";

// Вызов initData(sourceData) присваиваем константе API.
const api = initData(sourceData);
const { data, ...indexes } = initData(sourceData);

const sampleTable = initTable(
  {
    tableTemplate: "table",
    rowTemplate: "row",
    before: ["search", "header", "filter"],
    after: ["pagination"],
  },
  render
);

const { applyPagination, updatePagination } = initPagination(
  sampleTable.pagination.elements,
  (el, page, isCurrent) => {
    const input = el.querySelector("input");
    const label = el.querySelector("span");
    input.value = page;
    input.checked = isCurrent;
    label.textContent = page;
    return el;
  }
);

const applySorting = initSorting([
  // Нам нужно передать сюда массив элементов, которые вызывают сортировку, чтобы изменять их визуальное представление
  sampleTable.header.elements.sortByDate,
  sampleTable.header.elements.sortByTotal,
]);

const { applyFiltering, updateIndexes } = initFiltering(
  sampleTable.filter.elements,
  {
    // передаём элементы фильтра
    searchBySeller: indexes.sellers, // для элемента с именем searchBySeller устанавливаем массив продавцов
  }
);

const applySearching = initSearching("search");

function collectState() {
  const state = processFormData(new FormData(sampleTable.container));
  return {
    ...state,
    rowsPerPage: parseInt(state.rowsPerPage),
    page: parseInt(state.page ?? 1),
  };
}

async function render(action) {
  let state = collectState(); // собираем текущее состояние формы (страница, строки на странице и др)
  let query = {}; // объект с параметрами запроса к серверу

  query = applySearching(query, state, action);
  query = applyFiltering(query, state, action);
  query = applySorting(query, state, action);
  query = applyPagination(query, state, action);

  const { total, items } = await api.getRecords(query);

  // перерисовываем пагинатор
  updatePagination(total, query);
  sampleTable.render(items);
}

async function init() {
  const indexes = await api.getIndexes();
  updateIndexes(sampleTable.filter.elements, {
    searchBySeller: indexes.sellers,
  });

  await render();
}

const appRoot = document.querySelector("#app");
appRoot.appendChild(sampleTable.container);

init();
