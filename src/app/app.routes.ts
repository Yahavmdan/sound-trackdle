import { Routes } from '@angular/router';
import { HomeComponent } from "./components/home/home.component";
import { LoginComponent } from "./components/login/login.component";

export const routes: Routes = [
    {path: '', title: "Sound-Trackdle", component: HomeComponent},
    {path: 'home', title: "Sound-Trackdle", component: HomeComponent},
    {path: 'login', title: "Login", component: LoginComponent},
];
