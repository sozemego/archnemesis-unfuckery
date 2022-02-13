import { createSlice } from "@reduxjs/toolkit";
import { getOrganByName, ORGANS } from "../data/organs";

const initialState = {
  organs: {},
  trackedRecipes: [],
  hovered: null,
  combos: [[]],
};

function initEmptyOrgans(organs) {
  for (let organ of ORGANS) {
    organs[organ.name] = 0;
  }
}

initEmptyOrgans(initialState.organs);

const organsFromStorage = localStorage.getItem("organs");
const trackedRecipesFromStorage = localStorage.getItem("trackedRecipes");
const combosFromStorage = localStorage.getItem("combos");

if (!organsFromStorage) {
  saveOrgansToLocalStorage(initialState.organs);
} else {
  initialState.organs = JSON.parse(organsFromStorage);
}

if (!trackedRecipesFromStorage) {
  saveTrackedRecipesToLocalStorage(initialState.trackedRecipes);
} else {
  initialState.trackedRecipes = JSON.parse(trackedRecipesFromStorage);
}

if (!combosFromStorage) {
  saveCombosToLocalStorage(initialState.combos);
} else {
  initialState.combos = JSON.parse(combosFromStorage);
}

function saveOrgansToLocalStorage(organs) {
  localStorage.setItem("organs", JSON.stringify(organs));
}

function saveTrackedRecipesToLocalStorage(trackedRecipes) {
  localStorage.setItem("trackedRecipes", JSON.stringify(trackedRecipes));
}

function saveCombosToLocalStorage(combos) {
  console.log(JSON.stringify(combos));
  localStorage.setItem("combos", JSON.stringify(combos));
}

/**
 * Contains data about how many organs the player has, for the purposes of seeing which recipes are possible
 */
export const organSlice = createSlice({
  name: "organs",
  initialState,
  reducers: {
    incrementOrgan: (state, action) => {
      state.organs[action.payload] += 1;
      saveOrgansToLocalStorage(state.organs);
    },
    decrementOrgan: (state, action) => {
      state.organs[action.payload] = Math.max(
        0,
        state.organs[action.payload] - 1
      );
      saveOrgansToLocalStorage(state.organs);
    },
    clearAll: (state, action) => {
      initEmptyOrgans(state.organs);
      saveOrgansToLocalStorage(state.organs);
    },
    completeRecipe: (state, action) => {
      const organToMake = getOrganByName(action.payload);
      const ingredients = organToMake.ingredients;
      ingredients.forEach((ingredient) => (state.organs[ingredient] -= 1));
      state.organs[organToMake.name] += 1;
      saveOrgansToLocalStorage(state.organs);
    },
    setHovered: (state, action) => {
      state.hovered = action.payload;
    },
    toggleTracking: (state, action) => {
      const index = state.trackedRecipes.findIndex(
        (recipe) => recipe === action.payload
      );
      if (index > -1) {
        state.trackedRecipes.splice(index, 1);
      } else {
        state.trackedRecipes.push(action.payload);
      }
      saveTrackedRecipesToLocalStorage(state.trackedRecipes);
    },
    setStateFromPoeArchnemesisScanner: (state, action) => {
      if (Object.entries(action.payload).length === 0) {
        return;
      }
      initEmptyOrgans(state.organs);

      Object.entries(action.payload).forEach(([key, value]) => {
        state.organs[key] = value;
      });

      saveOrgansToLocalStorage(state.organs);
    },
    addCombo: (state, action) => {
      state.combos.push([action.payload]);
      saveCombosToLocalStorage(state.combos);
    },
    toggleOrganInCombo: (state, action) => {
      const { organ, index } = action.payload;
      const combo = state.combos[index];
      const nextCombo = state.combos[index + 1];

      const organIndex = combo.findIndex((comboOrgan) => comboOrgan === organ);
      if (organIndex > -1) {
        combo.splice(organIndex, 1);

        if (combo.length === 0 && nextCombo && nextCombo.length === 0) {
          // remove empty row
          state.combos.splice(index, 1);
        }
      } else {
        combo.push(organ);
        if (!nextCombo) {
          state.combos.push([]);
        }
      }

      saveCombosToLocalStorage(state.combos);
    },
  },
});

export const {
  incrementOrgan,
  decrementOrgan,
  clearAll,
  completeRecipe,
  setHovered,
  toggleTracking,
  setStateFromPoeArchnemesisScanner,
  addCombo,
  toggleOrganInCombo,
} = organSlice.actions;

export const getOrganCount = (state) => state.organs.organs;
export const getHovered = (state) => state.organs.hovered;
export const getTrackedRecipes = (state) => state.organs.trackedRecipes;
export const getCombos = (state) => state.organs.combos;

export default organSlice.reducer;
