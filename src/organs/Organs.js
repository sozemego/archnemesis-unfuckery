import React, { useEffect } from "react";
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
  getCombos,
  toggleOrganInCombo,
} from "./organsSlice";
import { getOrganByName, ORGANS } from "../data/organs";
import { REWARDS } from "../data/rewards";

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
      onMouseOut={() => dispatch(setHovered(null))}
    >
      <OrganParser />
      <OrganList />
      <RecipeTracker />
      <AllRecipeTracker />
      <UnusedRecipeTracker />
      <ComboTracker />
      <OverlappingRecipeTracker />
    </div>
  );
}

const fixMap = {
  "Treant Horder": "Treant Horde",
  "Steel-Infused": "Steel-infused",
  "Crystal-Skinned": "Crystal-skinned",
  "Kitava-Touched": "Kitava-touched",
  "Empowered Minions": "Empowering Minions",
  "Innocence-Touched": "Innocence-touched",
  "Shakari-Touched": "Shakari-touched",
  "Abberath-Touched": "Abberath-touched",
  "Tukohama-Touched": "Tukohama-touched",
  "Brine King-Touched": "Brine King-touched",
  "Arakaali-Touched": "Arakaali-touched",
  "Solaris-Touched": "Solaris-touched",
  "Lunaris-Touched": "Lunaris-touched",
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
        onChange={(e) => {}}
        onPaste={(event) => {
          const value = event.clipboardData.getData("text") || "";
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

function calcIsInAnyRecipeAtAnyLevel(trackedRecipes, organName) {
  // first check if it's tracked at the top level
  let isTracked =
    trackedRecipes.filter((recipe) => recipe === organName).length > 0;

  if (isTracked) {
    return true;
  }

  for (let trackedRecipe of trackedRecipes) {
    const ingredientsOfRecipe = getAllIngredientsOfRecipe(trackedRecipe);
    const ingredientsOfOrganName = getAllIngredientsOfRecipe(organName);
    ingredientsOfOrganName.push(organName);
    for (let ingredient of ingredientsOfRecipe) {
      for (let ingredientOfOrgan of ingredientsOfOrganName) {
        if (ingredient === ingredientOfOrgan) {
          return true;
        }
      }
    }
  }
  return false;
}

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
  const isHovered = hoveredOrganName === organ.name;

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

  let inAnyTrackedRecipeAtAnyLevel = calcIsInAnyRecipeAtAnyLevel(
    trackedRecipes,
    organ.name
  );

  let isTracked =
    trackedRecipes.filter((recipe) => recipe === organ.name).length > 0;

  function getBorder() {
    if (isIngredientOfHoveredOrgan) {
      return "3px solid blue";
    }

    if (isHoveredItemPartOfRecipeForMe) {
      return "3px solid red";
    }

    if (isHovered) {
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: 192,
        height: 64,
        padding: "4px 12px 4px 12px",
        margin: 4,
        border: getBorder(),
        position: "relative",
        borderRadius: inAnyTrackedRecipeAtAnyLevel ? "0px" : "25px",
        background: canBeCompleted
          ? "#9ac29a"
          : getCount() > 0
          ? "#dad6d6"
          : "white",
        transform: "scale(" + (inAnyTrackedRecipeAtAnyLevel ? 1 : 1) + ")",
      }}
      onMouseOver={() => dispatch(setHovered(organ.name))}
      onClick={(e) => {
        e.target.nodeName === "DIV" &&
          !isTracked &&
          dispatch(toggleTracking(organ.name));
      }}
    >
      <div style={{ display: "flex", flexDirection: "row" }}>
        <OrganTitle organ={organ} />
        <span style={{ paddingLeft: "2px" }}>({getCount()})</span>
      </div>
      <OrganRewards organ={organ} />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          visibility: isHovered ? "visible" : "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row" }}>
          <button
            onClick={() => dispatch(decrementOrgan(organ.name))}
            style={{ paddingLeft: "2px", paddingRight: "2px" }}
          >
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
          <button
            onClick={() => dispatch(incrementOrgan(organ.name))}
            style={{ paddingLeft: "2px", paddingRight: "2px" }}
          >
            +
          </button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() =>
              canBeCompleted && dispatch(completeRecipe(organ.name))
            }
            style={{
              color: canBeCompleted ? "black" : "gray",
              visibility:
                canBeCompleted && organ.ingredients.length > 0 && isHovered
                  ? "visible"
                  : "hidden",
            }}
          >
            COMPLETE
          </button>
        </div>
      </div>
      {organ.special && (
        <div
          style={{
            border: "4px dashed gray",
            borderRadius: "12px",
            minWidth: "128px",
            padding: "8px",
            position: "absolute",
            bottom: "54px",
            zIndex: 6,
            visibility: isHovered ? "visible" : "hidden",
            backgroundColor: "white",
          }}
        >
          {organ.special}
        </div>
      )}
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
        flexWrap: "none",
        whiteSpace: "nowrap",
      }}
    >
      {props.organ.name.toUpperCase()}
    </div>
  );
}

function OrganRewards(props) {
  const organ = props.organ;
  const rewards = organ.rewards;

  return (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>
      {rewards.map((reward, index) => (
        <img
          src={REWARDS[reward].icon}
          style={{
            width: "24px",
            height: "24px",
            marginLeft: "2px",
          }}
          key={reward + index}
        />
      ))}
    </div>
  );
}

const initialSort = localStorage.getItem("initialSort") || "default";

function OrganList() {
  const [sort, setSort] = React.useState(initialSort);
  const organsMap = useSelector(getOrganCount);
  const dispatch = useDispatch();

  const recipes = calcRecipes(organsMap);

  React.useEffect(() => localStorage.setItem("initialSort", sort), [sort]);

  function getOrgans() {
    if (sort === "default") {
      return ORGANS;
    }
    if (sort === "count") {
      const organs = [...ORGANS];
      organs.sort((o1, o2) => organsMap[o2.name] - organsMap[o1.name]);
      return organs;
    }
  }

  return (
    <div>
      <h2>List of all organs</h2>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <button onClick={() => setSort("count")}>SORT BY COUNT</button>
        <button onClick={() => setSort("default")}>SORT BY DEFAULT</button>
      </div>
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
        {getOrgans().map((organ) => (
          <Organ key={organ.name} organ={organ} recipes={recipes} />
        ))}
      </div>
    </div>
  );
}

/**
 * Returns all organs for which the user has enough parts to complete the recipe.
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

function calcSearchToClipboard(organ) {
  let searchString = "^(" + organ.name + ")";
  if (organ.ingredients.length > 0) {
    searchString =
      '"^(' +
      organ.ingredients
        .map((element) => element.split(" ")[0])
        .map((element) => element.split("-touched")[0])
        .join("|") +
      ')"';
  }
  navigator.clipboard.writeText(searchString);
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
        flexDirection: props.orientation === "horizontal" ? "row" : "column",
        minWidth: "280px",
        borderBottom: props.topLevel
          ? "2px dashed gray"
          : "1px solid transparent",
      }}
    >
      {props.topLevel && props.showStopTracking && (
        <button onClick={() => dispatch(toggleTracking(props.recipe))}>
          STOP TRACKING
        </button>
      )}
      <RecipeOrgan organ={organ} recipes={props.recipes} />
      <div
        style={{
          paddingLeft: props.orientation === "vertical" ? "24px" : "8px",
          paddingTop: "8px",
          borderLeft:
            props.orientation === "vertical"
              ? "1px dashed black"
              : "1px solid transparent",
        }}
      >
        {ingredients.map((ingredient) => (
          <Recipe
            key={ingredient}
            recipe={ingredient}
            recipes={props.recipes}
            topLevel={false}
            orientation={props.orientation}
          />
        ))}
      </div>
    </div>
  );
}

function RecipeOrgan(props) {
  const organCountMap = useSelector(getOrganCount);
  const [isHovered, setIsHovered] = React.useState(false);
  const dispatch = useDispatch();

  const organ = props.organ;
  const recipes = props.recipes;

  let canBeCompleted =
    recipes.filter((recipe) => recipe.name === organ.name).length > 0;

  function getBorder() {
    return "3px solid gray";
  }

  function getCount() {
    return organCountMap[organ.name];
  }

  return (
    <div
      id="recipe-organ-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 128 * 2,
        minHeight: 32,
        padding: "2px 4px 2px 4px",
        margin: 4,
        position: "relative",
        border: getBorder(),
        background: canBeCompleted
          ? "#9ac29a"
          : getCount() > 0
          ? "#c4bbbb"
          : "white",
      }}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      onClick={(e) => {
        calcSearchToClipboard(organ);
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
        }}
      >
        <OrganTitle organ={organ} />
        <span style={{ paddingLeft: "2px" }}>({getCount()})</span>
        <OrganRewards organ={organ} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          visibility: isHovered ? "visible" : "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row" }}>
          <button
            onClick={() => dispatch(decrementOrgan(organ.name))}
            style={{ paddingLeft: "2px", paddingRight: "2px" }}
          >
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
          <button
            onClick={() => dispatch(incrementOrgan(organ.name))}
            style={{ paddingLeft: "2px", paddingRight: "2px" }}
          >
            +
          </button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() =>
              canBeCompleted && dispatch(completeRecipe(organ.name))
            }
            style={{
              color: canBeCompleted ? "black" : "gray",
              visibility:
                canBeCompleted && organ.ingredients.length > 0 && isHovered
                  ? "visible"
                  : "hidden",
            }}
          >
            COMPLETE
          </button>
        </div>
      </div>
      {organ.special && (
        <div
          style={{
            border: "4px dashed gray",
            borderRadius: "12px",
            minWidth: "128px",
            padding: "8px",
            position: "absolute",
            bottom: "54px",
            zIndex: 5,
            visibility: isHovered ? "visible" : "hidden",
            backgroundColor: "white",
          }}
        >
          {organ.special}
        </div>
      )}
    </div>
  );
}

const initialOrientation =
  localStorage.getItem("recipeTrackerOrientation") || "vertical";

function RecipeTracker(props) {
  const trackedRecipes = useSelector(getTrackedRecipes);
  const organsMap = useSelector(getOrganCount);

  const recipes = calcRecipes(organsMap);
  const [orientation, setOrientation] = React.useState(initialOrientation);

  React.useEffect(() => {
    localStorage.setItem("recipeTrackerOrientation", orientation);
  }, [orientation]);

  return (
    <div>
      <h2>Recipe tracker</h2>
      <button
        onClick={() => setOrientation("horizontal")}
        style={{ fontSize: orientation === "horizontal" ? 24 : "inherit" }}
      >
        Horizontal
      </button>
      <button
        onClick={() => setOrientation("vertical")}
        style={{ fontSize: orientation === "vertical" ? 24 : "inherit" }}
      >
        Vertical
      </button>
      <div
        style={{
          display: "flex",
          width: "100%",
          flexWrap: "wrap",
          flexDirection: "row",
        }}
      >
        {trackedRecipes.map((recipe) => (
          <Recipe
            key={recipe}
            recipe={recipe}
            recipes={recipes}
            orientation={orientation}
            showStopTracking={true}
            topLevel={true}
          />
        ))}
      </div>
    </div>
  );
}

function AllRecipeTracker(props) {
  const organsMap = useSelector(getOrganCount);
  const recipes = calcRecipes(organsMap);
  return (
    <div>
      <h2>This section shows all the recipes that you can complete!</h2>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
        {recipes.map((recipe) => (
          <Recipe
            key={recipe.name}
            recipe={recipe.name}
            recipes={recipes}
            orientation={"vertical"}
            topLevel={true}
          />
        ))}
      </div>
    </div>
  );
}

function UnusedRecipeTracker(props) {
  const organsMap = useSelector(getOrganCount);
  const trackedRecipes = useSelector(getTrackedRecipes);

  const recipes = calcRecipes(organsMap).filter((recipe) => {
    const inAnyRecipe = calcIsInAnyRecipeAtAnyLevel(
      trackedRecipes,
      recipe.name
    );

    return !inAnyRecipe;
  });

  return (
    <div>
      <h2>
        This section shows all the recipes that you can complete, that don't use
        any ingredients for recipes that you track!
      </h2>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
        {recipes.map((recipe) => (
          <Recipe
            key={recipe.name}
            recipe={recipe.name}
            recipes={recipes}
            orientation={"vertical"}
            showStopTracking={false}
            topLevel={true}
          />
        ))}
      </div>
    </div>
  );
}

function ComboTracker(props) {
  const combos = useSelector(getCombos);
  return (
    <div>
      <h2>Here you can add combos manually that you want to track.</h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {combos.map((combo, index) => (
          <Combo combo={combo} index={index} key={index} />
        ))}
      </div>
    </div>
  );
}

function calcComboSearchToClipboard(combo) {
  const searchString =
    '"^(' +
    combo
      .map((element) => element.split(" ")[0])
      .map((element) => element.split("-touched")[0])
      .join("|") +
    ')"';
  navigator.clipboard.writeText(searchString);
}

function Combo(props) {
  const dispatch = useDispatch();
  const organMap = useSelector(getOrganCount);
  const combo = props.combo;
  const index = props.index;

  const canAddOrgan = combo.length < 4;

  const organsNotInCombo = ORGANS.filter(
    (organ) =>
      combo.filter((comboOrgan) => comboOrgan === organ.name).length === 0
  );

  const recipes = calcRecipes(organMap);
  const canBeCompleted =
    combo.filter((organ) => organMap[organ] > 0).length === combo.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        minHeight: "24px",
      }}
    >
      {combo.length > 0 && (
        <button onClick={(e) => calcComboSearchToClipboard(combo)}>COPY</button>
      )}
      {combo.map((organInCombo) => (
        <div
          key={organInCombo}
          style={{ display: "flex", flexDirection: "row" }}
        >
          <Recipe
            recipe={organInCombo}
            recipes={recipes}
            orientation={"vertical"}
            showStopTracking={false}
            topLevel={true}
          />
          <button
            style={{ maxHeight: "24px" }}
            onClick={(e) =>
              dispatch(toggleOrganInCombo({ organ: organInCombo, index }))
            }
          >
            X
          </button>
        </div>
      ))}
      {canAddOrgan && (
        <div>
          <select
            onChange={(e) =>
              dispatch(toggleOrganInCombo({ organ: e.target.value, index }))
            }
          >
            {organsNotInCombo.map((organNotInCombo) => (
              <option value={organNotInCombo.name} key={organNotInCombo.name}>
                {organNotInCombo.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {combo.length > 0 && (
        <button
          onClick={(e) => {
            for (let organ of combo) {
              dispatch(decrementOrgan(organ));
            }
          }}
          disabled={!canBeCompleted}
        >
          COMPLETE
        </button>
      )}
    </div>
  );
}

function OverlappingRecipeTracker(props) {
  const organCount = useSelector(getOrganCount);
  const recipes = calcRecipes(organCount);

  const overlappingRecipes = [];

  function findRecipeWithMatchingIngredients(recipe) {
    const recipeIngredients = recipe.ingredients;
    const recipeIngredientsLength = recipeIngredients.length;
    for (let otherRecipe of recipes) {
      if (otherRecipe === recipe) {
        continue;
      }

      const otherRecipeIngredients = otherRecipe.ingredients;
      const otherRecipeIngredientsLength = otherRecipeIngredients.length;

      const expectedLengthWithNoOverlap =
        recipeIngredientsLength + otherRecipeIngredientsLength;
      const overlappingOrgans = [
        ...new Set([...recipeIngredients, ...otherRecipeIngredients]),
      ];
      const actualLength = overlappingOrgans.length;

      if (actualLength !== expectedLengthWithNoOverlap) {
        return [recipe, otherRecipe, overlappingOrgans];
      }

      return null;
    }
    return null;
  }

  for (let recipe of recipes) {
    const matchingRecipe = findRecipeWithMatchingIngredients(recipe);
    if (matchingRecipe) {
      overlappingRecipes.push(matchingRecipe);
    }
  }

  return (
    <div style={{ marginBottom: "400px" }}>
      <h2>
        Tracks all recipes that have overlapping organs (e.g. you can complete
        two recipes, but don't use the full set of organs)
      </h2>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {overlappingRecipes.map((overlappingRecipe) => (
          <div
            style={{ display: "flex", flexDirection: "row" }}
            key={overlappingRecipe[0].name}
          >
            <Recipe
              recipe={overlappingRecipe[0].name}
              recipes={recipes}
              orientation={"vertical"}
              showStopTracking={false}
              topLevel={true}
            />
            <Recipe
              recipe={overlappingRecipe[1].name}
              recipes={recipes}
              orientation={"vertical"}
              showStopTracking={false}
              topLevel={true}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                flexWrap: "wrap",
                maxWidth: "620px",
                borderLeft: "1px dashed gray",
              }}
            >
              {overlappingRecipe[2].map((ingredient) => (
                <RecipeOrgan
                  key={ingredient}
                  organ={getOrganByName(ingredient)}
                  recipes={recipes}
                />
              ))}
              <button
                onClick={(e) =>
                  calcComboSearchToClipboard(overlappingRecipe[2])
                }
              >
                COPY
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
