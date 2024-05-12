import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeModule } from "./components/home/home.module";

@NgModule({
    imports: [
        CommonModule,
        HomeModule
    ]
})
export class AppModule {
}
