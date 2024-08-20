import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  data: any;

  constructor() {
    chrome.storage.local.get(['siteData'], (result: any) => {
      localStorage.setItem('siteData', JSON.stringify(result))
    });
  }

  ngOnInit(): void {
  }
}
