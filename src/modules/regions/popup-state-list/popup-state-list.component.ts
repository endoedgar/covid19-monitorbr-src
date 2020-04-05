import { Component, OnInit, OnDestroy } from "@angular/core";
import estados from "src/assets/data/estados.json";
import { AppState } from 'src/store/states/app.state';
import { Store } from '@ngrx/store';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { selectSelectedMapRegion$ } from 'src/store/selectors/region.selectors';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: "app-popup-state-list",
  templateUrl: "./popup-state-list.component.html",
  styleUrls: ["./popup-state-list.component.css"],
})
export class PopupStateListComponent implements OnInit, OnDestroy {
  public subscriptions$ : Subscription[];
  public estados: { codigo_uf: number; nome: string; uf: string }[];
  public selectedMapRegion;

  public mudarEstado(estado) {
    const sigla = this.selectedMapRegion ? this.selectedMapRegion.sigla : "BR";
    this.router.navigateByUrl(this.router.url.replace(sigla, estado.uf));

    this.dialogRef.close();
  }

  constructor(private store: Store<AppState>, private dialogRef: MatDialogRef<PopupStateListComponent>, private router : Router, public translate: TranslateService) {
  }

  ngOnDestroy(): void {
    this.subscriptions$.forEach(s => s.unsubscribe());
  }

  ngOnInit(): void {
    this.estados = [...estados]
    this.estados = this.estados.sort((a, b) => (a.nome > b.nome ? 1 : -1));
    this.estados.unshift({ uf: "BR", nome: this.translate.instant("map.brazil"), codigo_uf: 0 });

    this.subscriptions$ = [
      this.store.select(selectSelectedMapRegion$).subscribe(region => this.selectedMapRegion = region)
    ]
  }
}
