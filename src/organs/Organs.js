import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearAll,
  decrementOrgan,
  getOrganCount,
  incrementOrgan,
  completeRecipe,
  setHovered,
  getHovered,
  getTrackedRecipes,
  toggleTracking,
  setStateFromPoeArchnemesisScanner,
} from "./organsSlice";
import { getOrganByName, ORGANS } from "../data/organs";

export function Organs() {
  const dispatch = useDispatch();

  return (
    <div
      style={{ marginLeft: "24px" }}
      onPaste={(event) => {
        dispatch(
          setStateFromPoeArchnemesisScanner(
            parseFromPoeArchnemesisScanner(event.clipboardData.getData("text"))
          )
        );
      }}
    >
      <OrganParser />
      <OrganList />
      <RecipeTracker />
    </div>
  );
}

const fixMap = {
  "Treant Horder": "Treant Horde",
  "Steel-Infused": "Steel-infused",
  "Crystal-Skinned": "Crystal-skinned",
};

function fixInput(organs) {
  Object.entries(fixMap).forEach(([key, value]) => {
    if (organs[key]) {
      organs[value] = organs[key];
      delete organs[key];
    }
  });
}

function parseFromPoeArchnemesisScanner(input) {
  if (typeof input !== "string") {
    return {};
  }
  try {
    let regex = /\(.{1,8}\)/g;
    input = input.trim();
    let parts = input.split("{");
    if (parts.length > 1) {
      input = "{" + parts[1];
    } else {
      input = parts[0];
    }
    input = input.replaceAll("'", '"');
    input = input.replaceAll(regex, '"A"');

    let organs = JSON.parse(input);

    fixInput(organs);

    let correctOrgans = {};

    Object.entries(organs).forEach(([key, value]) => {
      correctOrgans[key] = value.length;
    });

    return correctOrgans;
  } catch (e) {
    console.error(e);
  }
  return {};
}

export function OrganParser(props) {
  const [value, setValue] = React.useState("");
  const dispatch = useDispatch();

  return (
    <div
      style={{
        display: "flex",
        position: "fixed",
        bottom: "40px",
        right: "20px",
        zIndex: 500,
        background: "white",
      }}
    >
      <span>
        ctrl+v anywhere or in this box to import from poe-archnemesis-scanner
      </span>
      <input
        value={value}
        onPaste={(event) => {
          const value = event.clipboardData.getData("text");
          dispatch(
            setStateFromPoeArchnemesisScanner(
              parseFromPoeArchnemesisScanner(value)
            )
          );
          setValue("");
        }}
      />
    </div>
  );
}

function OrganIcon(props) {
  return null;
}

function Organ(props) {
  const organCountMap = useSelector(getOrganCount);
  const dispatch = useDispatch();
  const hoveredOrganName = useSelector(getHovered);
  const trackedRecipes = useSelector(getTrackedRecipes);

  const organ = props.organ;
  const recipes = props.recipes;

  let isIngredientOfHoveredOrgan = false;
  let isHoveredItemPartOfRecipeForMe = false;

  const hoveredOrgan = getOrganByName(hoveredOrganName);

  if (hoveredOrgan) {
    isIngredientOfHoveredOrgan =
      hoveredOrgan.ingredients.filter((ingredient) => ingredient === organ.name)
        .length > 0;

    isHoveredItemPartOfRecipeForMe =
      organ.ingredients.filter((ingredient) => ingredient === hoveredOrganName)
        .length > 0;
  }

  let canBeCompleted =
    recipes.filter((recipe) => recipe.name === organ.name).length > 0;

  let inAnyTrackedRecipeAtAnyLevel = false;

  function getAllIngredientsOfRecipe(recipe) {
    const organ = getOrganByName(recipe);

    if (!organ) {
      throw new Error("No organ for recipe", recipe);
    }

    const allIngredients = [];

    if (organ.ingredients.length === 0) {
      return allIngredients;
    }

    for (let ingredient of organ.ingredients) {
      allIngredients.push(ingredient);
      allIngredients.push(...getAllIngredientsOfRecipe(ingredient));
    }

    return allIngredients;
  }

  for (let trackedRecipe of trackedRecipes) {
    const ingredientsOfRecipe = getAllIngredientsOfRecipe(trackedRecipe);
    for (let ingredient of ingredientsOfRecipe) {
      if (ingredient === organ.name) {
        inAnyTrackedRecipeAtAnyLevel = true;
      }
    }
    if (trackedRecipe === organ.name) {
      inAnyTrackedRecipeAtAnyLevel = true;
    }
  }

  function getBorder() {
    if (isIngredientOfHoveredOrgan) {
      return "3px solid blue";
    }

    if (isHoveredItemPartOfRecipeForMe) {
      return "3px solid red";
    }

    if (hoveredOrganName === organ.name) {
      return "3px solid orange";
    }

    return "3px solid gray";
  }

  function getCount() {
    return organCountMap[organ.name];
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: 175,
        height: 64,
        padding: 12,
        margin: 4,
        border: getBorder(),
        borderTopLeftRadius: inAnyTrackedRecipeAtAnyLevel ? "0px" : "25px",
        borderBottomRightRadius: inAnyTrackedRecipeAtAnyLevel ? "0px" : "25px",
        background: canBeCompleted
          ? "#9ac29a"
          : getCount() > 0
          ? "#c4bbbb"
          : "white",
        // transform: "scale(" + inAnyTrackedRecipeAtAnyLevel ? 1.25 : 1 + ")",
        transform: "scale(" + (inAnyTrackedRecipeAtAnyLevel ? 1 : 0.85) + ")",
      }}
      onMouseOver={() => dispatch(setHovered(organ.name))}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "128px",
          maxWidth: "128px",
        }}
      >
        <OrganIcon icon={organ.icon} />
        <OrganTitle organ={organ} />
        {organ.ingredients.length > 0 && (
          <button onClick={() => dispatch(toggleTracking(organ.name))}>
            TRACK
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <button onClick={() => dispatch(decrementOrgan(organ.name))}>
            -
          </button>
          <div
            style={{
              minWidth: "36px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {getCount()}
          </div>
          <button onClick={() => dispatch(incrementOrgan(organ.name))}>
            +
          </button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          {organ.ingredients.length > 0 && (
            <button
              onClick={() =>
                canBeCompleted && dispatch(completeRecipe(organ.name))
              }
              style={{ color: canBeCompleted ? "black" : "gray" }}
            >
              COMPLETE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrganTitle(props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {props.organ.name.toUpperCase()}
    </div>
  );
}

function OrganList() {
  const organsMap = useSelector(getOrganCount);
  const dispatch = useDispatch();

  const recipes = calcRecipes(organsMap);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginRight: "96px",
        }}
      >
        <button onClick={() => dispatch(clearAll())}>CLEAR ALL</button>
      </div>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
        {ORGANS.map((organ) => (
          <Organ key={organ.name} organ={organ} recipes={recipes} />
        ))}
      </div>
    </div>
  );
}

/**
 *
 */
function calcRecipes(organsMap) {
  return ORGANS.filter((organ) => {
    const ingredients = organ.ingredients;
    if (ingredients.length === 0) {
      return false;
    }
    return (
      ingredients.filter((ingredient) => organsMap[ingredient] > 0).length ===
      ingredients.length
    );
  });
}

function Recipe(props) {
  const organ = getOrganByName(props.recipe);
  const dispatch = useDispatch();
  const ingredients = organ.ingredients;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        flexDirection: "row",
        borderBottom: props.topLevel
          ? "2px dashed gray"
          : "1px solid transparent",
      }}
    >
      {props.topLevel && (
        <button onClick={() => dispatch(toggleTracking(props.recipe))}>
          STOP TRACKING
        </button>
      )}
      <RecipeOrgan organ={organ} recipes={props.recipes} />
      <div style={{ paddingLeft: "8px", paddingTop: "8px" }}>
        {ingredients.map((ingredient) => (
          <Recipe
            key={ingredient}
            recipe={ingredient}
            recipes={props.recipes}
            topLevel={false}
          />
        ))}
      </div>
    </div>
  );
}

function RecipeOrgan(props) {
  const organCountMap = useSelector(getOrganCount);
  const dispatch = useDispatch();
  const hoveredOrganName = useSelector(getHovered);

  const organ = props.organ;
  const recipes = props.recipes;

  let canBeCompleted =
    recipes.filter((recipe) => recipe.name === organ.name).length > 0;

  function getBorder() {
    // if (isIngredientOfHoveredOrgan) {
    //   return "1px solid orange";
    // }
    //
    // if (isHoveredItemPartOfRecipeForMe) {
    //   return "1px solid red";
    // }
    //
    // if (hoveredOrganName === organ.name && hoverStatesEnabled) {
    //   return "1px solid orange";
    // }

    return "1px solid gray";
  }

  function getCount() {
    return organCountMap[organ.name];
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: 128 * 2,
        height: 64,
        padding: 12,
        margin: 4,
        border: getBorder(),
        background: canBeCompleted
          ? "#9ac29a"
          : getCount() > 0
          ? "#c4bbbb"
          : "white",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "128px",
          maxWidth: "128px",
        }}
      >
        <OrganIcon icon={organ.icon} />
        <OrganTitle organ={organ} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <button onClick={() => dispatch(decrementOrgan(organ.name))}>
            -
          </button>
          <div
            style={{
              minWidth: "36px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {getCount()}
          </div>
          <button onClick={() => dispatch(incrementOrgan(organ.name))}>
            +
          </button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          {organ.ingredients.length > 0 && (
            <button
              onClick={() =>
                canBeCompleted && dispatch(completeRecipe(organ.name))
              }
              style={{ color: canBeCompleted ? "black" : "gray" }}
            >
              COMPLETE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecipeTracker(props) {
  const trackedRecipes = useSelector(getTrackedRecipes);
  const organsMap = useSelector(getOrganCount);

  const recipes = calcRecipes(organsMap);

  return (
    <div>
      <h2>Recipe tracker</h2>
      {trackedRecipes.map((recipe) => (
        <Recipe
          key={recipe}
          recipe={recipe}
          recipes={recipes}
          topLevel={true}
        />
      ))}
    </div>
  );
}
