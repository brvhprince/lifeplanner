export const validateEnvironmentVariables = () => {
	const globalEnvVars = [
		"DATABASE_PROVIDER",
		"DATABASE_URL",
		"SECRET_HASH_KEY",
		"APP_URL",
		"STORAGE",
		"VERIFY_EMAIL",
		"VRIFY_PHONE",
		"EMAIL_PROVIDER",
		"SMS_PROVIDER"
	];

	const exit = () => {
		process.exit(1);
	};

	const checkRequiredEnvVars = (envVars: string[]) => {
		const missingVars: string[] = [];

		envVars.forEach((varName) => {
			if (!process.env[varName]) {
				missingVars.push(varName);
			}
		});

		if (missingVars.length > 0) {
			console.error(`Missing environment variables: ${missingVars.join(", ")}`);
			return false;
		}

		return true;
	};
	const globalEnvVarsLoaded = checkRequiredEnvVars(globalEnvVars);

	if (!globalEnvVarsLoaded) {
		exit();
	}

	const smtpEnvVars = [
		"SMTP_HOST",
		"SMTP_FROM",
		"SMTP_USERNAME",
		"SMTP_PASSWORD",
		"SMTP_PORT",
		"SMTP_FROM_EMAIL",
		"SMTP_ENCRYPTION"
	];

	switch (process.env.EMAIL_PROVIDER) {
		case "mailgun":
			if (!checkRequiredEnvVars(["MAILGUN_API_KEY"])) {
				exit();
			}
			break;
		case "sendgrid":
			if (!checkRequiredEnvVars(["SENDGRID_API_KEY"])) {
				exit();
			}
			break;
		case "smtp":
			if (!checkRequiredEnvVars(smtpEnvVars)) {
				exit();
			}
			break;
		default:
			exit();
	}

	switch (process.env.SMS_PROVIDER) {
		case "arkesel":
			if (!checkRequiredEnvVars(["ARKESEL_API_KEY", "ARKESEL_SENDER_ID"])) {
				exit();
			}
			break;
		case "logonvoice":
			if (
				!checkRequiredEnvVars(["LOGONVOICE_API_KEY", "LOGONVOICE_SENDER_ID"])
			) {
				exit();
			}
			break;
		case "hubtel":
			if (
				!checkRequiredEnvVars([
					"HUBTEL_CLIENT_ID",
					"HUBTEL_CLIENT_SECRET",
					"HUBTEL_SENDER_ID"
				])
			) {
				exit();
			}
			break;
		case "telesign":
			if (!checkRequiredEnvVars(["TELESIGN_CUSTOMER_ID", "TELESIGN_API_KEY"])) {
				exit();
			}
			break;
		case "twilio":
			if (
				!checkRequiredEnvVars([
					"TWILIO_ACCOUNT_SID",
					"TWILIO_AUTH_TOKEN",
					"TWILIO_NUMBER"
				])
			) {
				exit();
			}
			break;
		default:
			exit();
	}
};
