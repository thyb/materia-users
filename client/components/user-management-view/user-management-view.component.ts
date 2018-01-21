const ngcore = (window as any).angular.core;
const Component = ngcore.Component;

@Component({
  selector: "materia-user-management-view",
  templateUrl: "./user-management-view.component.html",
  styleUrls: ["./user-management-view.component.scss"]
})

export class UserManagementViewComponent {
  userSelected: any;
  users: any;
  constructor(private app: any) {
    this.app.entities.get('user').getQuery('list').run().then(users => {
      this.users = users.rows
    }).catch(e => {
      console.log('error', e, e.stack)
    })
  }

  selectUser(user) {
    this.userSelected = user
  }

  signup(ev) {
    /* QueryService.execute(
      $rootScope.app.entities
        .get('user')
        .getQuery('signup')
      , null, ev
    )*/
  }
}
