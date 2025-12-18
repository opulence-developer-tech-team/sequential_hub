import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import measurementTemplateReducer, {
  MeasurementTemplateState,
} from "./measurement-template-slice";
import orderReducer, { OrderState } from "./order-slice";
import measurementOrderReducer, { MeasurementOrderState } from "./measurement-order-slice";
import adminUsersSlice, { AdminUsersState } from "./users-slice";
import dashboardSlice, { DashboardState } from "./dashbaord-slice";
import unusedImagesSlice, { UnusedImagesState } from "./unused-images-slice";

export interface ProductVariant {
  _id?: string; // MongoDB ObjectId as string (optional for new variants)
  imageUrls: string[]; // Array of image URLs for the variant (multiple angles, details, etc.)
  color: string;
  size: string;
  quantity: number;
  price: number;
  discountPrice: number;
  inStock: boolean;
  measurements?: {
    neck?: number;
    shoulder?: number;
    chest?: number;
    shortSleeve?: number;
    longSleeve?: number;
    roundSleeve?: number;
    tummy?: number;
    topLength?: number;
    waist?: number;
    laps?: number;
    kneelLength?: number;
    roundKneel?: number;
    trouserLength?: number;
    ankle?: number;
  };
}

export interface Product {
  _id?: string; // MongoDB ObjectId as string
  adminId: string;
  category: string;
  createdAt: string;
  description: string;
  material: string;
  productOwner: string;
  productVariant: ProductVariant[];
  isFeatured: boolean;
  name: string;
  slug: string;
}

export interface AdminState {
  productData: {
    hasFetchedProducts: boolean;
    products: Product[];
  };
  users: AdminUsersState;
  measurementTemplates: MeasurementTemplateState;
  orders: OrderState;
  measurementOrders: MeasurementOrderState;
  dashboard: DashboardState;
  unusedImages: UnusedImagesState;
}

const initialState: AdminState = {
  productData: {
    hasFetchedProducts: false,
    products: [],
  },
  users: {
    users: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
    hasFetchedUsers: false,
  },
  measurementTemplates: {
    templates: [],
    hasFetchedTemplates: false,
  },
  orders: {
    orders: [],
    hasFetchedOrders: false,
  },
  measurementOrders: {
    orders: [],
    hasFetchedOrders: false,
  },
  dashboard: {
    stats: null,
    hasFetchedStats: false,
  },
  unusedImages: {
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
  },
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    // Replace full products array
    setProducts(state, action: PayloadAction<Product[]>) {
      state.productData.products = action.payload;
      state.productData.hasFetchedProducts = true;
    },

    // Add new product
    addProduct(state, action: PayloadAction<Product>) {
      state.productData.products.push(action.payload);
    },

    // Update/replace a product using its _id.
    // The expected usage is to pass the full, fresh Product document
    // returned from the backend as `updated`.
    updateProduct(
      state,
      action: PayloadAction<{ _id: string; updated: Partial<Product> }>
    ) {
      const index = state.productData.products.findIndex(
        (p) => p._id === action.payload._id
      );

      if (index !== -1) {
        const currentProduct = state.productData.products[index];
        const updated = action.payload.updated;

        // Replace the product with the updated document, while keeping
        // any fields that might be missing on `updated`.
        const next: Product = {
          ...currentProduct,
          ...updated,
        } as Product;

        const updatedProducts = [...state.productData.products];
        updatedProducts[index] = next;
        state.productData.products = updatedProducts;
      }
    },

    // Remove a product by slug
    removeProduct(state, action: PayloadAction<string>) {
      state.productData.products = state.productData.products.filter(
        (p) => p.slug !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Delegate measurement template actions to the measurement template reducer
    builder
      .addCase(
        measurementTemplateReducer.actions.setTemplates,
        (state, action) => {
          state.measurementTemplates.templates = action.payload;
          state.measurementTemplates.hasFetchedTemplates = true;
        }
      )
      .addCase(
        measurementTemplateReducer.actions.addTemplate,
        (state, action) => {
          state.measurementTemplates.templates.push(action.payload);
        }
      )
      .addCase(
        measurementTemplateReducer.actions.updateTemplate,
        (state, action) => {
          const index = state.measurementTemplates.templates.findIndex(
            (t) => t._id === action.payload._id
          );
          if (index !== -1) {
            state.measurementTemplates.templates[index] = action.payload.updated;
          }
        }
      )
      .addCase(
        measurementTemplateReducer.actions.removeTemplate,
        (state, action) => {
          state.measurementTemplates.templates =
            state.measurementTemplates.templates.filter(
              (t) => t._id !== action.payload
            );
        }
      )
      .addCase(measurementTemplateReducer.actions.clearTemplates, (state) => {
        state.measurementTemplates.templates = [];
        state.measurementTemplates.hasFetchedTemplates = false;
      })
      // Delegate order actions to the order reducer
      .addCase(orderReducer.actions.setOrders, (state, action) => {
        state.orders.orders = action.payload;
        state.orders.hasFetchedOrders = true;
      })
      .addCase(orderReducer.actions.addOrder, (state, action) => {
        state.orders.orders.push(action.payload);
      })
      .addCase(orderReducer.actions.updateOrder, (state, action) => {
        const index = state.orders.orders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (index !== -1) {
          state.orders.orders[index] = {
            ...state.orders.orders[index],
            ...action.payload.updated,
          };
        }
      })
      .addCase(orderReducer.actions.updateOrderStatus, (state, action) => {
        const index = state.orders.orders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (index !== -1) {
          state.orders.orders[index].orderStatus = action.payload.status;
        }
      })
      .addCase(orderReducer.actions.removeOrder, (state, action) => {
        state.orders.orders = state.orders.orders.filter(
          (o) => o._id !== action.payload
        );
      })
      .addCase(orderReducer.actions.clearOrders, (state) => {
        state.orders.orders = [];
        state.orders.hasFetchedOrders = false;
      })
      // Delegate measurement order actions to the measurement order reducer
      .addCase(measurementOrderReducer.actions.setOrders, (state, action) => {
        state.measurementOrders.orders = action.payload;
        state.measurementOrders.hasFetchedOrders = true;
      })
      .addCase(measurementOrderReducer.actions.addOrder, (state, action) => {
        state.measurementOrders.orders.push(action.payload);
      })
      .addCase(measurementOrderReducer.actions.updateOrder, (state, action) => {
        const index = state.measurementOrders.orders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (index !== -1) {
          state.measurementOrders.orders[index] = {
            ...state.measurementOrders.orders[index],
            ...action.payload.updated,
          };
        }
      })
      .addCase(measurementOrderReducer.actions.updateOrderStatus, (state, action) => {
        const index = state.measurementOrders.orders.findIndex(
          (o) => o._id === action.payload._id
        );
        if (index !== -1) {
          state.measurementOrders.orders[index].status = action.payload.status;
        }
      })
      .addCase(measurementOrderReducer.actions.removeOrder, (state, action) => {
        state.measurementOrders.orders = state.measurementOrders.orders.filter(
          (o) => o._id !== action.payload
        );
      })
      .addCase(measurementOrderReducer.actions.clearOrders, (state) => {
        state.measurementOrders.orders = [];
        state.measurementOrders.hasFetchedOrders = false;
      })
      // Delegate admin users actions
      .addCase(adminUsersSlice.actions.setUsers, (state, action) => {
        state.users.users = action.payload.users;
        state.users.pagination = action.payload.pagination;
        state.users.hasFetchedUsers = true;
      })
      .addCase(adminUsersSlice.actions.clearUsers, (state) => {
        state.users = {
          users: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
          hasFetchedUsers: false,
        };
      })
      // Delegate dashboard actions
      .addCase(dashboardSlice.actions.setDashboardStats, (state, action) => {
        state.dashboard.stats = action.payload;
        state.dashboard.hasFetchedStats = true;
      })
      .addCase(dashboardSlice.actions.clearDashboardStats, (state) => {
        state.dashboard.stats = null;
        state.dashboard.hasFetchedStats = false;
      })
      // Delegate unused images actions
      .addCase(unusedImagesSlice.actions.setUnusedImages, (state, action) => {
        state.unusedImages.images = action.payload.images;
        state.unusedImages.pagination = action.payload.pagination;
        state.unusedImages.hasFetchedImages = true;
      })
      .addCase(unusedImagesSlice.actions.removeUnusedImage, (state, action) => {
        state.unusedImages.images = state.unusedImages.images.filter(
          (img) => img.imageUrl !== action.payload
        );
        state.unusedImages.pagination.total = Math.max(
          0,
          state.unusedImages.pagination.total - 1
        );
        state.unusedImages.pagination.totalPages = Math.ceil(
          state.unusedImages.pagination.total /
            state.unusedImages.pagination.limit
        );
        state.unusedImages.pagination.hasNextPage =
          state.unusedImages.pagination.page <
          state.unusedImages.pagination.totalPages;
      })
      .addCase(unusedImagesSlice.actions.clearUnusedImages, (state) => {
        state.unusedImages = {
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
      });
  },
});

export const adminActions = {
  ...adminSlice.actions,
  // Re-export order actions
  setOrders: orderReducer.actions.setOrders,
  addOrder: orderReducer.actions.addOrder,
  updateOrder: orderReducer.actions.updateOrder,
  updateOrderStatus: orderReducer.actions.updateOrderStatus,
  removeOrder: orderReducer.actions.removeOrder,
  clearOrders: orderReducer.actions.clearOrders,
  // Re-export measurement order actions
  setMeasurementOrders: measurementOrderReducer.actions.setOrders,
  addMeasurementOrder: measurementOrderReducer.actions.addOrder,
  updateMeasurementOrder: measurementOrderReducer.actions.updateOrder,
  updateMeasurementOrderStatus: measurementOrderReducer.actions.updateOrderStatus,
  removeMeasurementOrder: measurementOrderReducer.actions.removeOrder,
  clearMeasurementOrders: measurementOrderReducer.actions.clearOrders,
  // Re-export unused images actions
  setUnusedImages: unusedImagesSlice.actions.setUnusedImages,
  removeUnusedImage: unusedImagesSlice.actions.removeUnusedImage,
  clearUnusedImages: unusedImagesSlice.actions.clearUnusedImages,
};
export default adminSlice;
