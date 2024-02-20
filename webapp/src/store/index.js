import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import { persistReducer } from "redux-persist";
import { thunk } from "redux-thunk";

// Enviroment variables
import { ENV } from "../config";

// Reducers
import userReducer from "./slices/userSlice";

const reducers = combineReducers({
  user: userReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user"],
};

const persistedReducer = persistReducer(persistConfig, reducers);

const store = configureStore({
  reducer: persistedReducer,
  devTools: ENV !== "production",
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(thunk);
  },
});

export default store;
