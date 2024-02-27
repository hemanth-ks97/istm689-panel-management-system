import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

export const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
  },
  reducers: {
    setUser: (state, action) => {
      const fullUser = jwtDecode(action.payload);
      // Discard what we don't need!
      state.user = {
        email: fullUser.email,
        name: fullUser.name,
        picture: fullUser.picture,
        googleToken: action.payload,
      };
    },
    clearUser: (state) => {
      state.user = null;
    },
    setToken: (state, action) => {
      state.user.token = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setUser, setToken, clearUser } = userSlice.actions;

export default userSlice.reducer;
