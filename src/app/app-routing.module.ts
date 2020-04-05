import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RouteGuard } from 'src/services/routeguard.service';

const routes: Routes = [
  {
    path: ":state",
    canActivate: [ RouteGuard ],
    children: [],
    pathMatch: 'full'
  },
  {
    path: ":state/:mode/:date",
    canActivate: [ RouteGuard ],
    children: [],
    pathMatch: 'full'
  },
  {
    path: "**",
    redirectTo: "BR/SELECT_CITY/last"
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
