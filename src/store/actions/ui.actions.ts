import { createAction, props } from "@ngrx/store";

export const ShowMessage = createAction(
  "[UI] Show Message",
  props<{message: string}>()
);
