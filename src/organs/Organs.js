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
} from "./organsSlice";
import { getOrganByName, ORGANS } from "../data/organs";

export function Organs() {
  return (
    <div style={{ marginLeft: "24px" }}>
      <OrganList />
      <RecipeTracker />
    </div>
  );
}

function OrganIcon(props) {
  return null;
  return <img src={props.icon} style={{ width: "48px", height: "48px" }} />;
}

function Organ(props) {
  const organCountMap = useSelector(getOrganCount);
  const dispatch = useDispatch();
  const hoveredOrganName = useSelector(getHovered);

  const organ = props.organ;
  const recipes = props.recipes;
  const hoverStatesEnabled = props.hoverStatesEnabled;

  let isIngredientOfHoveredOrgan = false;
  let isHoveredItemPartOfRecipeForMe = false;

  const hoveredOrgan = getOrganByName(hoveredOrganName);

  if (hoveredOrgan && hoverStatesEnabled) {
    isIngredientOfHoveredOrgan =
      hoveredOrgan.ingredients.filter((ingredient) => ingredient === organ.name)
        .length > 0;

    isHoveredItemPartOfRecipeForMe =
      organ.ingredients.filter((ingredient) => ingredient === hoveredOrganName)
        .length > 0;
  }

  let canBeCompleted =
    recipes.filter((recipe) => recipe.name === organ.name).length > 0;

  function getBorder() {
    if (isIngredientOfHoveredOrgan) {
      return "1px solid orange";
    }

    if (isHoveredItemPartOfRecipeForMe) {
      return "1px solid red";
    }

    if (hoveredOrganName === organ.name && hoverStatesEnabled) {
      return "1px solid orange";
    }

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
        height: 88,
        padding: 12,
        margin: 4,
        border: getBorder(),
        background: canBeCompleted
          ? "#9ac29a"
          : getCount() > 0
          ? "#c4bbbb"
          : "white",
      }}
      onMouseOver={() => hoverStatesEnabled && dispatch(setHovered(organ.name))}
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
          <button
            onClick={() =>
              canBeCompleted && dispatch(completeRecipe(organ.name))
            }
            style={{ color: canBeCompleted ? "black" : "gray" }}
          >
            COMPLETE
          </button>
        </div>
      </div>
      {hoverStatesEnabled && organ.ingredients.length > 0 && (
        <button onClick={() => dispatch(toggleTracking(organ.name))}>
          TRACK
        </button>
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
          <Organ
            key={organ.name}
            organ={organ}
            recipes={recipes}
            hoverStatesEnabled={true}
          />
        ))}
      </div>
    </div>
  );
}

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
      }}
    >
      {props.topLevel && (
        <button onClick={() => dispatch(toggleTracking(props.recipe))}>
          STOP TRACKING
        </button>
      )}
      <Organ organ={organ} recipes={props.recipes} hoverStatesEnabled={false} />
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
