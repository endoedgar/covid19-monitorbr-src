import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-aviso-inicial',
  templateUrl: './aviso-inicial.component.html',
  styleUrls: ['./aviso-inicial.component.css']
})
export class AvisoInicialComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<AvisoInicialComponent>) { }

  ngOnInit(): void {
  }

  fechar() {
    this.dialogRef.close();
  }
}
