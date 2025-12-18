import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface MeasurementField {
  name: string;
}

export interface MeasurementTemplate {
  _id: string;
  adminId: string;
  title: string;
  fields: MeasurementField[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MeasurementTemplateState {
  templates: MeasurementTemplate[];
  hasFetchedTemplates: boolean;
}

const initialState: MeasurementTemplateState = {
  templates: [],
  hasFetchedTemplates: false,
};

const measurementTemplateSlice = createSlice({
  name: "measurementTemplate",
  initialState,
  reducers: {
    // Set all templates (replace existing)
    setTemplates(state, action: PayloadAction<MeasurementTemplate[]>) {
      state.templates = action.payload;
      state.hasFetchedTemplates = true;
    },

    // Add a new template
    addTemplate(state, action: PayloadAction<MeasurementTemplate>) {
      state.templates.push(action.payload);
    },

    // Update an existing template
    updateTemplate(
      state,
      action: PayloadAction<{ _id: string; updated: MeasurementTemplate }>
    ) {
      const index = state.templates.findIndex(
        (t) => t._id === action.payload._id
      );

      if (index !== -1) {
        state.templates[index] = action.payload.updated;
      }
    },

    // Remove a template
    removeTemplate(state, action: PayloadAction<string>) {
      state.templates = state.templates.filter(
        (t) => t._id !== action.payload
      );
    },

    // Clear all templates
    clearTemplates(state) {
      state.templates = [];
      state.hasFetchedTemplates = false;
    },
  },
});

export const measurementTemplateActions = measurementTemplateSlice.actions;
export default measurementTemplateSlice;
