class SocialAccountModel {
	constructor(app, entity) {
		this.app = app;
		this.model = entity.model;

		this.config = this.app.addons.addonsConfig['@materia/users']
	}

	find(params) {
		return this.model.findOne({
			where: {
				provider: params.provider,
				social_user_id: params.social_user_id
			}
		}, { raw: true })
	}
}

module.exports = SocialAccountModel;
