import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UnusedImage {
  _id: string;
  imageUrl: string;
  publicId: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnusedImagesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UnusedImagesState {
  images: UnusedImage[];
  pagination: UnusedImagesPagination;
  hasFetchedImages: boolean;
}

const initialState: UnusedImagesState = {
  images: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  hasFetchedImages: false,
};

const unusedImagesSlice = createSlice({
  name: "unusedImages",
  initialState,
  reducers: {
    setUnusedImages(
      state,
      action: PayloadAction<{
        images: UnusedImage[];
        pagination: UnusedImagesPagination;
      }>
    ) {
      state.images = action.payload.images;
      state.pagination = action.payload.pagination;
      state.hasFetchedImages = true;
    },
    removeUnusedImage(state, action: PayloadAction<string>) {
      state.images = state.images.filter(
        (img) => img.imageUrl !== action.payload
      );
      state.pagination.total = Math.max(0, state.pagination.total - 1);
      state.pagination.totalPages = Math.ceil(
        state.pagination.total / state.pagination.limit
      );
      state.pagination.hasNextPage =
        state.pagination.page < state.pagination.totalPages;
    },
    clearUnusedImages(state) {
      state.images = [];
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
      state.hasFetchedImages = false;
    },
  },
});

export const unusedImagesActions = unusedImagesSlice.actions;
export default unusedImagesSlice;





















