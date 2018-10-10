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
}

module.exports = UserTokenModel;
