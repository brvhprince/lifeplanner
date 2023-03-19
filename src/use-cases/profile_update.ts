import { makeUserProfile } from "../entities";
import { Utils } from "../frameworks";
import {
	MakeCreateUserProfile,
	plannerDatabase,
	Validation,
	FileUpload,
	StorageFolderTypes,
	ProfileUpdate
} from "../types";

export default function makeUpdateProfile({
	plannerDb,
	Validation,
	Upload
}: {
	plannerDb: plannerDatabase;
	Validation: Validation;
	Upload: FileUpload;
}) {
	return async function updateProfile(profileInfo: MakeCreateUserProfile) {
		const profile = makeUserProfile(profileInfo);

		if (!profile.getUserId()) {
			throw new Validation.ResponseError(
				"You are not authorized to access this resource"
			);
		}

		const exists = await plannerDb.findProfileByUserId({
			userId: profile.getUserId()
		});

		if (!exists.item) {
			throw new Validation.ResponseError(
				"You are not authorized to access this resource"
			);
		}

		const profilePayload: ProfileUpdate = {
			userId: profile.getUserId()
		};

		if (profileInfo.about) {
			profilePayload.about = profile.getAbout();
		}

		if (profileInfo.dob) {
			profilePayload.date_of_birth = profile.getDateOfBirth();
		}

		if (profileInfo.funFacts) {
			profilePayload.fun_facts = profile.getFunFacts();
		}

		if (profileInfo.gender) {
			profilePayload.gender = profile.getGender();
		}

		if (profileInfo.metadata) {
			profilePayload.metadata = profile.getMetadata();
		}

		if (profileInfo.nationality) {
			profilePayload.nationality = profile.getNationality();
		}

		if (profileInfo.otherGender) {
			profilePayload.other_gender = profile.getOtherGender();
		}

		if (profileInfo.pinCode) {
			profilePayload.pin_code = profile.getPinCode();
		}

		if (profileInfo.placeOfBirth) {
			profilePayload.place_of_birth = profile.getPlaceOfBirth();
		}

		if (profileInfo.securityQuestions) {
			profilePayload.security_questions = profile.getSecurityQuestions();
		}

		if (profileInfo.twoFa) {
			profilePayload.two_fa = profile.getTwoFa();
		}

		if (profileInfo.twoFaCode) {
			profilePayload.two_fa_code = profile.getTwoFaCode();
		}

		const avatar = profile.getAvatar();
		const cover = profile.getCoverImage();
		let avatar_id;
		let cover_id;

		if (avatar) {
			const path = await Upload.file(avatar, StorageFolderTypes.profile);

			if (!path) {
				throw new Validation.ResponseError(
					"An error uploading your profile avatar"
				);
			}

			const { item } = await plannerDb.createFile({
				user_id: profile.getUserId(),
				name: avatar.originalFilename,
				type: avatar.type,
				category: StorageFolderTypes.profile,
				size: avatar.size,
				path,
				hash: Utils.md5(Utils.generateReference())
			});

			if (!item)
				throw new Validation.ResponseError("An error uploading profile avatar");

			avatar_id = item.id;
		}
		if (cover) {
			const path = await Upload.file(cover, StorageFolderTypes.profile);

			if (!path) {
				throw new Validation.ResponseError(
					"An error uploading your profile cover image"
				);
			}

			const { item } = await plannerDb.createFile({
				user_id: profile.getUserId(),
				name: cover.originalFilename,
				type: cover.type,
				category: StorageFolderTypes.profile,
				size: cover.size,
				path,
				hash: Utils.md5(Utils.generateReference())
			});

			if (!item)
				throw new Validation.ResponseError(
					"An error uploading profile cover image"
				);

			cover_id = item.id;
		}

		if (avatar_id) {
			profilePayload.avatar = {
				connect: {
					id: avatar_id
				}
			};
		}

		if (cover_id) {
			profilePayload.cover = {
				connect: {
					id: cover_id
				}
			};
		}

		if (Object.keys(profilePayload).length === 1) {
			await plannerDb.createActivity({
				activity_id: Utils.Id.makeId(),
				user: {
					connect: {
						user_id: profile.getUserId()
					}
				},
				title: "Profile Update Unchanged",
				description:
					"A new profile update was requested but no changes were made because the payload was empty",
				metadata: {
					date: new Date().toUTCString(),
					source: JSON.stringify(profile.getSource())
				},
				hash: Utils.md5(Utils.generateReference())
			});

			return {
				status: 304,
				message: "No changes were detected",
				item: undefined
			};
		}

		await plannerDb.createActivity({
			activity_id: Utils.Id.makeId(),
			user: {
				connect: {
					user_id: profile.getUserId()
				}
			},
			title: "Profile Changed",
			description: "Profile was updated successfully",
			metadata: {
				date: new Date().toUTCString(),
				source: JSON.stringify(profile.getSource())
			},
			hash: Utils.md5(Utils.generateReference())
		});

		return await plannerDb.updateUserProfile(profilePayload);
	};
}
