
import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { Addon, AddonSetup } from "@materia/addons";

@Addon({
	package: "@materia/users",
	deps: []
})
@Component({
	selector: "materia-user-management",
	templateUrl: "./user-management.component.html",
	styleUrls: ["./user-management.component.scss"],
	providers: []
})
export default class UserManagementViewComponent implements OnInit {
	@Input() app;
	@Input() settings;

	@Output() openSetup = new EventEmitter<void>();

	constructor() {}

	ngOnInit() {}
}