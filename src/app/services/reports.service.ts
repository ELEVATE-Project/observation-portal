import { Injectable } from '@angular/core';
import { UtilsService } from './utils.service';
import { ToastService } from './toast.service';
import { ShareLinkPopupComponent } from '../shared/share-link-popup/share-link-popup.component';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor(private utils:UtilsService,private toaster:ToastService,private dialog: MatDialog,) { }

  async shareReport(link,type:any){
    if(this.utils.isMobile()){
      try {
        const shareOptions = {
          title: `${type} Report`,
          text: `Check out this ${type} report`,
          url: link
        };
        await Share.share(shareOptions);
      } catch (err:any) {
        this.toaster.showToast(err?.error?.message, 'danger');
      }
    }else {
      this.setOpenForCopyLink(link);
    }
  }
  
  setOpenForCopyLink(url:any){
    const dialogRef=this.dialog.open(ShareLinkPopupComponent, {
          width: '400px',
          data: url
    })
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        Clipboard.write({ string: result });
        this.toaster.showToast('LINK_COPY_SUCCESS', 'success');
      }
    });
  }
}