import { configureStore } from "@reduxjs/toolkit";
import organsReducer from "../organs/organsSlice";

export const store = configureStore({ reducer: { organs: organsReducer } });
