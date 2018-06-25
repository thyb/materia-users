import { Component } from "@angular/core";
import { Addon } from "@materia/addons";

@Addon({
	package: "@materia/users",
	name: "User Management",
	logo: "https://cdn4.iconfinder.com/data/icons/business-and-management/78/Business_management_strategy_office-09-256.png",
	deps: []
})
@Component({
	selector: "materia-user-management-view",
	templateUrl: "./user-management-view.component.html",
	styleUrls: ["./user-management-view.component.scss"]
})
export class UserManagementViewComponent {
	userSelected: any;
	users: any;
	constructor() {}

	selectUser(user) {
		this.userSelected = user;
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
