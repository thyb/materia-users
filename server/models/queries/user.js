const md5 = require('md5')

class UserModel {
	constructor(app, model) {
		this.app = app;
		this.model = model;

		this.config = this.app.addons.addonsConfig['@materia/users']
	}

	_translate(message, user, redirect_url) {
		message = message.replace(new RegExp(`\\[redirect_url\\]`, 'gi'), redirect_url)
		this.app.entities.get('user').getFields().forEach(field => {
			if (field.name != 'password' && field.name != 'salt' && field.name != 'key' && field.name != 'status') {
				let e = new RegExp(`\\[user.${field.name}\\]`, 'gi')
				message = message.replace(e, user[field.name])
			}
		})
		return message
	}

	_getDomain() {
		let link = `http://${this.app.server.host}`
		if (this.app.server.port != 80) {
			link += `:${this.app.server.port}`
		}
		link += `/`
		return link
	}

	_generateKey() {
		return md5(Math.random()).substr(0, 8)
	}

	signup(params) {
		console.log('in signup query', params)
		let user = this.app.entities.get('user')

		let password = params.password
		let salt = this._generateKey()
		let staticSalt = this.config.static_salt
		let encryptedPassword = md5(staticSalt + password + salt)

		params.password = encryptedPassword
		params.salt = salt
		params.key_email = this._generateKey()

		return user.getQuery('create').run(params).then(created => {
			return this.sendVerificationEmail({id_user: created.id_user}).then(() => created).catch(() => created)
		})
	}

	sendVerificationEmail(params) {
		let userEntity = this.app.entities.get('user')

		if (this.config.email_verification && (this.config.type == 'email' || this.config.type == 'both')) {
			console.log('sendVerifyEmail')
			return userEntity.getQuery('get').run(params).then(user => {
				console.log(user)
				let verify_url = `${this.app.server.getBaseUrl()}/user/verify/${user.id_user}/${user.key_email}`
				let message = this._translate(this.config.email_signup.message, user, verify_url)
				let subject = this._translate(this.config.email_signup.subject, user, verify_url)
				if (user.new_email) {
					message = this._translate(this.config.email_change_email.message, user, verify_url)
					subject = this._translate(this.config.email_change_email.subject, user, verify_url)
				}
				console.log(message, subject)
				return this.app.entities.get(this.config.email_action.entity).getQuery(this.config.email_action.query).run({
					to: user.email,
					subject: subject,
					body: message
				}).then(() => user)
			})
		}
		else {
			return Promise.reject('Email verification disabled')
		}
	}

	verifyEmail(params) {
		let userEntity = this.app.entities.get('user')
		return userEntity.getQuery('get').run({
			id_user: params.id_user
		}, {raw: true}).then(user => {
			let isSignup = true
			if (user.key_email == params.key_email && (user.status == 'unverified' || user.new_email)) {
				let updates = {
					status: 'verified',
					key_email: null,
					id_user: user.id_user
				}

				if (user.new_email) {
					updates.email = user.new_email
					updates.new_email = ''
					isSignup = false
				}

				return userEntity.getQuery('update').run(updates).then(() => {
					if (isSignup) {
						return this.config.email_signup.redirect_url
					}
					else {
						return this.config.email_change_email.redirect_url
					}
				})
			}
			else return Promise.reject('User email found but the key / status mismatch.')
		})
	}

	lostPasswordVerify(params) {
		let key = this._generateKey()

		let link = this.app.server.getBaseUrl()
		link += `/user/lost-password/${params.email}/${key}`

		if (this.config.email_verification && (this.config.type == 'email' || this.config.type == 'both')) {			
			return this.app.entities.get('user').getQuery('getByEmail').run({
				email: params.email
			}).then(response => {
				let user = response.data

				return this.app.entities.get('user').getQuery('update').run({
					key_password: key,
					id_user: user.id_user
				}).then(() => user)
			}).then(user => {
				let subject = this._translate(this.config.email_lostpassword.subject, user)
				let message = this._translate(this.config.email_lostpassword.message, user)

				//send the email
				return this.app.entities.get(this.config.email_action.entity).getQuery(this.config.email_action.query).run({
					to: params.email,
					subject: subject,
					body: message
				})
			}).then(() => true)
		}
		else {
			return Promise.reject("Impossible to run lost password. Email disabled")
		}
	}
}
module.exports = UserModel;
