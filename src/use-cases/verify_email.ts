import { plannerDatabase, Validation, UtilType } from "../types";

export default function makeVerifyEmail({
	plannerDb,
	Validation,
	Utils
}: {
	plannerDb: plannerDatabase;
	Validation: Validation;
	Utils: UtilType;
}) {
	return async function verifyEmail({ code }: { code: string }) {
		if (!code) {
			throw new Validation.ResponseError("Verification link url is invalid");
		}

		const decoded = Utils.decryptString(code);

		if (!decoded) {
			throw new Validation.ResponseError("Verification link url is invalid");
		}
		const verification = await plannerDb.findVerificationCode({
			code: parseInt(decoded)
		});

		if (!verification.item) {
			throw new Validation.ResponseError(
				"Invalid verification link. Check and retry"
			);
		}

		const expires = new Date(verification.item.expires).getTime();
		const now = new Date().getTime();
		if (now > expires) {
			throw new Validation.ResponseError(
				"Verification link has expired. Please request a new one"
			);
		}

		const status = await plannerDb.verifyUserEmail({
			email: verification.item.value
		});

		if (!status.status) {
			throw new Validation.ResponseError(
				"An error occurred verifying your email. Contact support"
			);
		}

		await plannerDb.removeVerificationCode({ code: parseInt(decoded) });

		return {
			status: 200,
			message: "Email verification successful. You may close this page now"
		};
	};
}
