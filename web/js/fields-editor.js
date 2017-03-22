angular.module('user-management')
.directive('fieldEditor', () => {
    return {
        restrict: 'A',
        scope: {
            field: '=',
            onRemove: '&'
        },

        template: `<td>
        <input ng-disabled="field.disabled" placeholder="Enter a field name" type="text" ng-model="field.name">
    </td>
    <td>
        <select ng-disabled="field.disabled" ng-model="field.type">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
            <option value="float">Float</option>
        </select>
    </td>
    <td>
        <md-checkbox ng-disabled="field.disabled" ng-model="field.unique"></md-checkbox>
    </td>
    <td>
        <md-checkbox ng-disabled="field.disabled || field.unique" ng-model="field.required"></md-checkbox>
    </td>
    <td>
        <md-checkbox ng-disabled="field.disabled || field.unique || field.required" ng-model="field.signup"></md-checkbox>
    </td>
    <td>
        <md-button class="md-icon-button" ng-hide="field.disabled" ng-click="onRemove()">
            <md-tooltip>Remove</md-tooltip>
            <md-icon>close</md-icon>
        </md-button>
    </td>`,
        link: (scope, element, attr) => {
            scope.$watch('field.unique', (newVal) => {
                if (newVal) {
                    scope.field.required = true
                    scope.field.signup = true
                }
            })

            scope.$watch('field.required', newVal => {
                if (newVal) {
                    scope.field.signup = true
                }
            })

            /*scope.now = () => {
                scope.field.defaultValue = '$now'
            }

            scope.removeDefaultValue = () => {
                scope.field.defaultValue = ''
            }*/

        }
    }
}).component('fieldsEditor', {
    template: `<div class="fields-editor">
<table style="width: 100%">
    <thead>
        <th style="min-width: 135px">Field</th>
        <th>Type</th>
        <th>Unique</th>
        <th>Required</th>
        <th>Signup</th>
        <th></th>
    </thead>
    <tbody>
        <tr field-editor on-remove="$ctrl.remove($index)" field="field" ng-repeat="field in $ctrl.defaultFields track by $index">
        </tr>
        <tr field-editor on-remove="$ctrl.remove($index)" field="field" ng-repeat="field in $ctrl.fields track by $index">
        </tr>
    </tbody>
</table>
<div ng-if=" ! newField" class="text-center" style="margin-top: 10px;">
    <md-button ng-click="$ctrl.newField()">
        <md-icon>add</md-icon>
        Add new field
    </md-button>
</div>
</div>`,
    controller: function($rootScope) {

        $rootScope.$watch(() => this.type, (newVal) => {
            this.defaultFields = []

            this.defaultFields.unshift({
                name: 'password',
                required: true,
                unique: false,
                signup: true,
                disabled: true,
                default: false,
                type: 'text'
            })

            if (newVal == 'username' || newVal == 'both') {
                this.defaultFields.unshift({
                    name: 'username',
                    required: true,
                    unique: true,
                    signup: true,
                    disabled: true,
                    default: false,
                    type: 'text'
                })
            }
            if (newVal == 'email' || newVal == 'both') {
                this.defaultFields.unshift({
                    name: 'email',
                    required: true,
                    unique: true,
                    signup: true,
                    disabled: true,
                    default: false,
                    type: 'text'
                })
            }
        })


        this.newField = () => {
            this.fields.push({
                name: '',
                type: '',
                required: false,
                unique: false,
                signup: true
            })
        }

        this.remove = (id) => {
            console.log('remove', id)
            this.fields.splice(id, 1)
        }
    },
    bindings: {
        fields: '=',
        type: '<'
    }
})