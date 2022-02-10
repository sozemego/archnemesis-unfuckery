import { useDispatch, useSelector } from "react-redux";
import {
  CloseOutlined,
  MinusCircleOutlined,
  NodeIndexOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { Button, Card, Row } from "antd";
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
      return "5px solid orange";
    }

    if (isHoveredItemPartOfRecipeForMe) {
      return "3px solid red";
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
        border: getBorder(),
        background: canBeCompleted
          ? "#9ac29a"
          : getCount() > 0
          ? "#c4bbbb"
          : "white",
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
          <Button
            type="dashed"
            icon={<MinusCircleOutlined />}
            onClick={() => dispatch(decrementOrgan(organ.name))}
          />{" "}
          <div
            style={{
              minWidth: "36px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            {getCount()}
          </div>
          <Button
            type="dashed"
            icon={<PlusCircleOutlined />}
            onClick={() => dispatch(incrementOrgan(organ.name))}
          />
        </div>
        <div
          style={{
            visibility: canBeCompleted ? "visible" : "hidden",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button onClick={() => dispatch(completeRecipe(organ.name))}>
            COMPLETE
          </Button>
        </div>
      </div>
      <Button
        icon={
          <NodeIndexOutlined
            onClick={() => dispatch(toggleTracking(organ.name))}
          />
        }
      />
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
        <Button onClick={() => dispatch(clearAll())}>CLEAR ALL</Button>
      </div>
      <Row>
        {ORGANS.map((organ) => (
          <Organ
            key={organ.name}
            organ={organ}
            recipes={recipes}
            hoverStatesEnabled={true}
          />
        ))}
      </Row>
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
        <Button
          icon={<CloseOutlined />}
          onClick={() => dispatch(toggleTracking(props.recipe))}
        />
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
