import { createSlice } from "@reduxjs/toolkit";
import { getOrganByName, ORGANS } from "../data/organs";

const initialState = {
  organs: {},
  trackedRecipes: [],
  hovered: null,
};

function initEmptyOrgans(organs) {
  for (let organ of ORGANS) {
    organs[organ.name] = 0;
  }
}

initEmptyOrgans(initialState.organs);

const organsFromStorage = localStorage.getItem("organs");
const trackedRecipesFromStorage = localStorage.getItem("trackedRecipes");

if (!organsFromStorage) {
  saveOrgansToLocalStorage(initialState.organs);
} else {
  initialState.organs = JSON.parse(organsFromStorage);
}

if (!trackedRecipesFromStorage) {
  saveTrackedRecipesToLocalStorage([]);
} else {
  initialState.trackedRecipes = JSON.parse(trackedRecipesFromStorage);
}

function saveOrgansToLocalStorage(organs) {
  localStorage.setItem("organs", JSON.stringify(organs));
}

function saveTrackedRecipesToLocalStorage(trackedRecipes) {
  localStorage.setItem("trackedRecipes", JSON.stringify(trackedRecipes));
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
  },
});

export const {
  incrementOrgan,
  decrementOrgan,
  clearAll,
  completeRecipe,
  setHovered,
  toggleTracking,
} = organSlice.actions;

export const getOrganCount = (state) => state.organs.organs;
export const getHovered = (state) => state.organs.hovered;
export const getTrackedRecipes = (state) => state.organs.trackedRecipes;

export default organSlice.reducer;
