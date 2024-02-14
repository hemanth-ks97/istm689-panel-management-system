import { configureStore } from "@reduxjs/toolkit";

// Enviroment variables
import { ENV } from "../config";

// Reducers
import userReducer from "./slices/userSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    devTools: ENV !== "production",
  },
});
