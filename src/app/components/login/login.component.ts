import { Component, OnInit } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { NgClass, NgIf } from "@angular/common";
import { FileService } from "../../shared/services/file.service";
import { AuthService } from "../../shared/services/auth.service";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, NgClass],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  private _zipFile = null;
  public isAdmin: boolean = false;


  constructor(private _fileService: FileService,
              private _authService: AuthService) {
  }

  ngOnInit(): void {
    this._isAdmin();
  }

  private _isAdmin(): void {
    this._authService.isAdmin.subscribe((isAdminAuthenticated: boolean): void => {
      this.isAdmin = isAdminAuthenticated;
    });
  }

  public login(username: string, password: string): void {
    if (!username || !password) return;
    this._authService.login({username, password}).subscribe(res => {
      this._authService.storeUserData(res);
    })
  }

  public logout(): void {
    this._authService.logout();
  }

  public upload(): void {
    if (!this._zipFile) {
      console.error('No files selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', this._zipFile);
    console.log(formData);

    this._fileService.upload(formData)
      .subscribe({
        next: (response) => {
          console.log(response);
          console.log('Files uploaded successfully');
        },
        error: (error) => {
          console.error('Error uploading files:', error);
        }
      });
  }

  public massDelete(): void {
    let answer: boolean = confirm('Are you sure you want to delete?');
    if (!answer) return;
    this._fileService.massDelete().subscribe(res => {
      console.log(res)
    });
  }

  public fileIndex(): void {
    this._fileService.fileIndex().subscribe(res => {
      console.log(res)
    });
  }

  public onFileSelected(event: any): void {
    const files = event.target.files;
    if (files.length > 0) {
      this._zipFile = files[0];
    } else {
      this._zipFile = null;
    }
  }
}
