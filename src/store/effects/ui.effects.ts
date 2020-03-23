import { Actions, Effect, ofType } from "@ngrx/effects";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Observable } from "rxjs";
import { ShowMessage } from "../actions/ui.actions";
import { tap, map } from "rxjs/operators";
import { Injectable } from '@angular/core';

@Injectable()
export class UIEffects {
  constructor(private actions: Actions, private snackbar: MatSnackBar) {}

  @Effect({ dispatch: false })
  showMessage$: Observable<any> = this.actions.pipe(
    ofType(ShowMessage),
    map(action => action.message),
    tap(message => {
      console.log(message);
      this.snackbar.open(message, "Okay", {
        duration: 5000
      });
    })
  );
}
