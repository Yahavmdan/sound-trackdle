import { Component } from '@angular/core';
import { BaseService } from "../../shared/services/base.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})

export class HomeComponent {
  selectedFile: File | null = null;
  audioBlob: Blob | null = null;
  audioBlobUrl: string | null = null;
  errorMessage: string = '';

  constructor(private baseService: BaseService) {}

  public onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] as File;
  }

  public onSubmit() {
    if (!this.selectedFile) {
      console.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.baseService.upload(formData)
        .subscribe({
          next: (response) => {
            console.log(response);
            console.log('File uploaded successfully');
          },
          error: (error) => {
            console.error('Error uploading file:', error);
          }
        });
  }

  public getTrack(fileName: string) {
    this.baseService.getTrack(fileName).subscribe({
      next: (data: Blob) => {
        this.audioBlob = data;
        this.audioBlobUrl = URL.createObjectURL(this.audioBlob);
        this.errorMessage = '';
        console.log(this.audioBlob);
        console.log(this.audioBlobUrl);
      },
      error: () => {
        this.errorMessage = 'File not found';
        this.audioBlob = null;
        this.audioBlobUrl = null;
      }
    });
  }
}

