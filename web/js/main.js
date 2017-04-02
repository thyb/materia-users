const path = require('path')

let um = angular.module('user-management', [
    'ngResource',
    'ngSanitize',
    'ngMessages',
    'ngAnimate'
]).filter('md5', () => { 
    return (input) => {
        const md5 = require('md5')
        return md5(input)
    }
})
.controller('UserManagementCtrl', ($scope, $rootScope, QueryService) => {
    $rootScope.app.entities.get('user').getQuery('list').run().then(users => {
        $scope.users = users.rows
        $scope.$apply()
    }).catch(e => {
        console.log('error', e, e.stack)
    })

    $scope.selectUser = (user) => {
        $scope.userSelected = user
    }

    $scope.signup = (ev) => {
        QueryService.execute(
            $rootScope.app.entities
                .get('user')
                .getQuery('signup')
            , null, ev
        )
    }
}).controller('UserManagementInstallCtrl', ($scope, $rootScope, $compile, AddonsService, $mdDialog, $ocLazyLoad) => {
    //loading dynamically css + components
    $ocLazyLoad.load(path.join($rootScope.app.addons.get('@materia/users').path, 'web/main.css'))
    $ocLazyLoad.load(path.join($rootScope.app.addons.get('@materia/users').path, 'web/js/fields-editor.js')).then(() => {
        $compile(angular.element('fields-editor'))($scope)
    })


    function init() {
        $scope.entities = $rootScope.app.entities.findAll()
        $scope.newField = false
        $scope.step = 0
        $scope.forms = []
        $scope.error = {
            status: false
        }

        //if configuration already exists => load config to edit
        if ($rootScope.app.addons.addonsConfig['@materia/users']) {
            //copy config to not alter addonsConfig without clicking on save
            $scope.setupConfig = JSON.parse(JSON.stringify($rootScope.app.addons.addonsConfig['@materia/users']))

            if ($scope.setupConfig.email_action) {
                $scope.setupConfig.email_action.entity = $rootScope.app.entities.get($scope.setupConfig.email_action.entity)
                if ( $scope.setupConfig.email_action.entity ) {
                    $scope.setupConfig.email_action.query = $scope.setupConfig.email_action.entity.getQuery($scope.setupConfig.email_action.query)
                }
            }
            
            $scope.steps = [
                { //login type
                    completed: true,
                    disabled: false
                },
                { //user
                    completed: true,
                    disabled: false
                },
                { //emails
                    completed: true,
                    disabled: false
                }
            ]
        }
        else {
            $scope.setupConfig = {
                type: 'email',
                fields: [],
                static_salt: '',
                email_verification: false
            }
            $scope.steps = [
                { //login type
                    completed: false,
                    disabled: false
                },
                { //user
                    completed: false,
                    disabled: true
                },
                { //emails
                    completed: false,
                    disabled: true
                }
            ]
        }
    }
    init()

    $scope.newFieldButton = () => {
        $scope.newField = true
    }

    let defaultResult = []
    $scope.getQueries = () => {
        if ($scope.setupConfig.email_action && $scope.setupConfig.email_action.entity && $scope.setupConfig.email_action.entity.getQueries) {
            return $scope.setupConfig.email_action.entity.getQueries()
        }
        else return defaultResult;
    }


    $scope.back = () => {
        if ($scope.step > 0) {
            $scope.step--
        }
    }

    $scope.selectStep = (index) => {
        if ( ! $scope.steps[index].disabled) {
            $scope.step = index
        }
    }

    //create fields (email / username / password) depending on the login type

    $scope.nextStep = (form) => {
        $scope.error = {
            status: false
        }
        if ($scope.step > 2) {
            return false
        }
        form.$submitted = true
        if ( form.$invalid ) {
            console.log('invalid form:', form.$invalid, form)
            return false
        }
        if ($scope.step == 0) {
            $scope.steps[0].completed = true
            $scope.steps[1].disabled = false
            $scope.step = 1
        }
        else if ($scope.step == 1) {
            //check if fields are all valid
            $scope.setupConfig.fields.forEach((field, i) => {
                if ( ! field.name || ! field.type ) {
                    $scope.error = {
                        status: true,
                        step: 1,
                        message: "Field " + (i + 1) + " is incomplete. Missing name or type."
                    }
                }
            })
            if ($scope.error.status) { return false }
            $scope.accordeon = [false,false,false]
            $scope.steps[1].completed = true
            $scope.steps[2].disabled = false
            $scope.step = 2
        }
        else if ($scope.step == 2) {
            //reduce the config of email verification by setting up only the entity name and the query id
            if ($scope.setupConfig.email_verification) {
                if ($scope.setupConfig.email_action && $scope.setupConfig.email_action.query && $scope.setupConfig.email_action.entity) {
                    if ($scope.setupConfig.email_action.entity.getQuery($scope.setupConfig.email_action.query.id)) {
                        $scope.setupConfig.email_action.entity = $scope.setupConfig.email_action.entity.name
                        $scope.setupConfig.email_action.query = $scope.setupConfig.email_action.query.id
                    }
                    else {
                        $scope.error = {
                            status: true,
                            message: "When the email verification enabled, you have to select the entity/query to send an email (Mailjet or Sendgrid addon)"
                        }
                    }
                }
                else {
                    $scope.error = {
                        status: true,
                        message: "When the email verification enabled, you have to select the entity/query which handle emails (mailjet or sendgrid addon)"
                    }
                }
                if ($scope.error.status) {return false}
            }
            else {
                if ($scope.setupConfig.email_action) {
                    delete $scope.setupConfig.email_action
                }
            }
            //remove disabled fields for the JSON file (deduced by the type)
            let toRemove = []
            $scope.setupConfig.fields.forEach((field, i) => {
                if (field.disabled) {
                    toRemove.push(i)
                }
            })
            toRemove.reverse().forEach(index => {
                $scope.setupConfig.fields.splice(index, 1)
            })

            $rootScope.app.addons.get('@materia/users').setup($scope.setupConfig)
            $mdDialog.hide($scope.setupConfig)
        }
    }
    $scope.cancel = () => { $mdDialog.cancel() }
})
module.exports = um