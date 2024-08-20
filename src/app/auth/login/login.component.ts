import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  data: any;
  parentWindowId: any;
  profile: any;

  constructor() {
    this.profile = null;
  }

  ngOnInit(): void {
    if (localStorage.getItem('siteData')) {
      const temp = localStorage.getItem('siteData');
      if (temp) {
        this.data = JSON.parse(temp);
        this.parentWindowId = this.data.siteData.parentTab.id;
      }
    }

    chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
      if (message.title == 'fromBackground') {
        console.log(message.info)
        sendResponse(true);
      }

      if (message.title == 'refreshPage') {
        setTimeout(() => {
          chrome.tabs.sendMessage(message.windowId, { title: 'parsePage', tab: message.windowId, ceTabId: message.ceTabId })
        }, 500);
        sendResponse(true);
      }

      if(message.title == 'parsedData') {
        console.log(message.payload)  
        this.profile = message.payload;
      }
    })
  }

}
