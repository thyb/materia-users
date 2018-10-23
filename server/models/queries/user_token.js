const Sequelize = require('sequelize');

class UserTokenModel {
	constructor(app, entity) {
		this.app = app;
		this.model = entity.model;

		this.config = this.app.addons.addonsConfig['@materia/users']
	}

	clearExpiredTokens() {
		return this.model.destroy({
			where: {
				expires_in: {
					[Sequelize.Op.lt]: new Date()
				}
			}
		})
	}

	getActiveTokens(params) {
		return this.model.findAll({
			where: {
				expires_in: {
					[Sequelize.Op.gt]: new Date()
				},
				id_user: params.id_user
			},
			order: [['expires_in', 'DESC']]
		})
	}
}

module.exports = UserTokenModel;
