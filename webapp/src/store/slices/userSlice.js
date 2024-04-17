import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

export const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
  },
  reducers: {
    setUser: (state, action) => {
      const pmsUser = jwtDecode(action.payload);

      state.user = {
        name: pmsUser?.name,
        email: pmsUser?.email,
        picture: pmsUser?.picture,
        role: pmsUser?.role,
        isOwnToken: pmsUser?.iss.endsWith("-pms-core"),
        expiration: pmsUser?.exp,
        token: action.payload,
      };
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;
