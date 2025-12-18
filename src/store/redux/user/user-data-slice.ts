import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";

export interface UserData {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isEmailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDataState {
  user: UserData | null;
  hasFetchedUserData: boolean;
}

const initialState: UserDataState = {
  user: null,
  hasFetchedUserData: false,
};

const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    setUserData(state, action: PayloadAction<UserData>) {
      state.user = action.payload;
      state.hasFetchedUserData = true;
    },
    clearUserData(state) {
      state.user = null;
      state.hasFetchedUserData = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: any) => {
      // Reset hasFetchedUserData on rehydration since we're not persisting user data
      state.hasFetchedUserData = false;
      state.user = null;
    });
  },
});

export const { setUserData, clearUserData } =
  userDataSlice.actions;

export default userDataSlice;
