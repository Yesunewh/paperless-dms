import { Component, OnInit } from '@angular/core'
import { SavedViewService } from 'src/app/services/rest/saved-view.service'
import { SettingsService } from 'src/app/services/settings.service'
import { ComponentWithPermissions } from '../with-permissions/with-permissions.component'
import { TourService } from 'ngx-ui-tour-ng-bootstrap'
import { SavedView } from 'src/app/data/saved-view'
import { ToastService } from 'src/app/services/toast.service'
import { Document } from 'src/app/data/document'
import {
  CdkDragDrop,
  CdkDragEnd,
  CdkDragStart,
  moveItemInArray,
} from '@angular/cdk/drag-drop'
import { environment } from 'src/environments/environment' 
import { DocumentListViewService } from 'src/app/services/document-list-view.service'
import { ConsumerStatusService } from 'src/app/services/consumer-status.service'
import { Subject, filter, first, takeUntil } from 'rxjs'
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'pngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent 
extends ComponentWithPermissions
implements OnInit {
  public dashboardViews: SavedView[] = []
  constructor(
    public list: DocumentListViewService,
    public settingsService: SettingsService,
    public savedViewService: SavedViewService,
    private tourService: TourService,
    public route: ActivatedRoute,
    private consumerStatusService: ConsumerStatusService,
    private toastService: ToastService
  ) {
    super()

    this.savedViewService.listAll().subscribe(() => {
      this.dashboardViews = this.savedViewService.dashboardViews
    })
  }

  get subtitle() {
    if (this.settingsService.displayName) {
      return $localize`Hello ${this.settingsService.displayName}, welcome to ${environment.appTitle}`
    } else {
      return $localize`Welcome to ${environment.appTitle}`
    }
  }

  private unsubscribeNotifier: Subject<any> = new Subject()

  ngOnInit(): void { 

    // this.consumerStatusService
    //   .onDocumentConsumptionFinished()
    //   .pipe(takeUntil(this.unsubscribeNotifier))
    //   .subscribe(() => {
    //     this.list.reload()
    //   })

      this.route.queryParamMap
      .pipe(
        filter(() => false), // only when not on /view/id
        takeUntil(this.unsubscribeNotifier)
      )
      .subscribe((queryParams) => {
        if (queryParams.has('view')) {
          //loading a saved view on /documents
          // this.loadViewConfig(parseInt(queryParams.get('view')))
        } else {
          this.list.activateSavedView(null)
          this.list.loadFromQueryParams(queryParams)
          // this.unmodifiedFilterRules = []
        }
      })

    }


    loadViewConfig(viewID: number) {
      this.savedViewService
        .getCached(viewID)
        .pipe(first())
        .subscribe((view) => {
          // this.unmodifiedSavedView = view  
          this.list.activateSavedView(view)
          this.list.reload()
        })
    }

    
    // Method to stringify an object
    stringifyObject(obj: any): string {
      const return_data = JSON.stringify(obj);
      console.log(return_data)
      return return_data;
    }

  trackByDocumentId(index, item: Document) {
    console.log('item is', item)
    console.log('index_is', index)

    return item.id
  }

  completeTour() {
    if (this.tourService.getStatus() !== 0) {
      this.tourService.end() // will call settingsService.completeTour()
    } else {
      this.settingsService.completeTour()
    }
  }

  onDragStart(event: CdkDragStart) {
    this.settingsService.globalDropzoneEnabled = false
  }

  onDragEnd(event: CdkDragEnd) {
    this.settingsService.globalDropzoneEnabled = true
  }

  onDrop(event: CdkDragDrop<SavedView[]>) {
    moveItemInArray(
      this.dashboardViews,
      event.previousIndex,
      event.currentIndex
    )

    this.settingsService
      .updateDashboardViewsSort(this.dashboardViews)
      .subscribe({
        next: () => {
          this.toastService.showInfo($localize`Dashboard updated`)
        },
        error: (e) => {
          this.toastService.showError($localize`Error updating dashboard`, e)
        },
      })
  }
}
