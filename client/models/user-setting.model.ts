export interface UserManagementSettings {
    method: string;
    user_profile_enabled: boolean;
    user_profile_entity: string;
    email_verification: boolean;
    email_addon: string;
    template_signup?: number;
    redirect_signup?: string;
    subject_signup?: string;
    subject_lost_password?: string;
    subject_change_email?: string;
    template_lost_password?: number;
    redirect_lost_password?: string;
    template_change_email?: number;
    redirect_change_email?: string;
}
