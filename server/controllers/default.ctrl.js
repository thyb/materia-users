class DefaultCtrl {
	constructor(app) { this.app = app; }

	me(req, res, next) {
		let module={};
		module.exports = (req, app) => {
		    return Promise.resolve(req.user)
		}
		return Promise.resolve(module.exports(req, this.app, res));
	}

	signin(req, res, next) {
		var passport = require('passport')
		console.log('signin endpoint')
		return new Promise((resolve, reject) => {
			passport.authenticate('local', function(err, user, info) {
				console.log(err, user)
				if (err) { return reject(err) }
				if (!user) { return reject(new Error('bad credentials')) }
				console.log('resolve')
				req.logIn(user, function(err) {
					if (err) { return reject(err); }
					return resolve(user)
				});
			})(req, res, next)
		})
	}

	signup(req, res, next) {
		let params = Object.assign({}, req.query, req.body, req.params)
		let user = this.app.entities.get('user')
		return user.getQuery('signup').run(params).then(() => {
			let login = params.email || params.username
			req.body.login = login
			return this.signin(req, res)
		})
	}

	logout(req, res, next) {
		req.logout()
		return Promise.resolve()
	}

	destroy(req, res, next) {
		if (req.user && req.user.id_user) {
			user.getQuery('delete').run({
				id_user: req.user.id_user
			})
			req.logout()
			return Promise.resolve()
		}
		else {
			return Promise.reject('Not authorized')
		}
	}

	//Params: new_email
	changeEmail(req, res, next) {
		let params = Object.assign({}, req.query, req.body)
		let userEntity = app.entities.get('user')

		if (req.user && req.user.email) {
			return userEntity.getQuery('update').run({
				id_user: req.user.id_user,
				new_email: params.new_email
			}).then(() => {
				req.user.new_email = params.new_email
			})
		}
	}

	//Params: key & new_password || old_password & new_password
	changePassword(req, res, next) {
		let params = Object.assign({}, req.query, req.body)
		let userEntity = app.entities.get('user')

		//lost password
		if (params.key && params.new_password && this.config.email_verification && (this.config.type == 'email' || this.config.type == 'both')) {
			return userEntity.getQuery('getByEmail').run({
				email: params.email
			}).then(response => {
				let user = response.data

				if (user.key_password == params.key) {
					return userEntity.getQuery('update').run({
						password: params.new_password,
						key_password: null,
						id_user: user.id_user
					})
				}
				else return Promise.reject('key does not match')
			})
		}
		//regular change password (once logged in)
		else {
			if (req.user && params.old_password && params.new_password) {
				let staticSalt = this.config.staticSalt

				return userEntity.getQuery('getByEmail').run({
					email: req.user.email
				}).then(response => {
					let user = response.data

					let encryptedOldPassword = md5(staticSalt + params.old_password + user.salt)
					let encryptedNewPassword = md5(staticSalt + params.new_password + user.salt)

					if (user.password == encryptedOldPassword) {
						return userEntity.getQuery('update').run({
							id_user: user.id_user,
							password: encryptedNewPassword,
							key_password: null
						})
					}
					else {
						return Promise.reject('old password does not match')
					}
				})
			}
			else {
				return Promise.reject('Missing required parameter')
			}
		}
	}

	safeUpdate(req, res, next) {
		let params = Object.assign({}, req.query, req.body)
		if (req.user && req.user.id_user) {
			let updates = { id_user: req.user.id_user }
			this.config.fields.forEach(field => {
				if (params[field.name] !== undefined && ['password', 'salt', 'key_email', 'new_email', 'key_password'].indexOf(field.name) == -1) {
					updates[field.name] = params[field.name]
				}
			})

			return this.app.entities.get('user').getQuery('update').run(updates);
		}
		else {
			return Promise.reject('unauthorized');
		}
	}

	verifyEmail(req, res, next) {
		let params = Object.assign({}, req.query, req.body, req.params)
		console.log('verify email', params)
		return this.app.entities.get('user').getQuery('verifyEmail').run(params).then(redirect => {
			console.log('after verify', redirect)
			res.redirect(redirect)
			return Promise.resolve()
		})
	}
}
module.exports = DefaultCtrl;
