import { makeAccount } from "../entities";
import { Utils } from "../frameworks";
import {
	CreateAccount,
	MakeCreateAccount,
	plannerDatabase,
	Validation,
	FileUpload,
	StorageFolderTypes,
	CreateFile
} from "../types";

export default function makeNewAccount({
	plannerDb,
	Validation,
	Upload
}: {
	plannerDb: plannerDatabase;
	Validation: Validation;
	Upload: FileUpload;
}) {

	return async function newAccount(accountInfo: MakeCreateAccount) {
		const account = makeAccount(accountInfo);

		const exists = await plannerDb.findAccountByHash({ hash: account.getHash() });

		if (exists.item) {
			throw new Validation.ResponseError(
				"Transactional account already exists"
			);
		}
		const image = account.getImage()
		const files = account.getFiles()
		let image_id = undefined
		let files_ids = undefined

		if (image) {
			const path = await Upload.file(image, StorageFolderTypes.account)
			
			if (!path) {
				throw new Validation.ResponseError("An error uploading your account image/icon");
			}
		
				const{ item } = await plannerDb.createFile({
					user_id: account.getUserId(),
					name: image.originalFilename,
					type: image.type,
					category: StorageFolderTypes.account,
					size: image.size,
					path,
					hash: account.getHash() + Date.now()
				})

				if (!item) throw new Validation.ResponseError("An error uploading account image/icon");

				image_id = item.id
			
		}

		if (files) {
			const paths = await Upload.files(files, StorageFolderTypes.account)
			
			if (!paths || paths.length === 0) {
				throw new Validation.ResponseError("An error uploading one of your account reference files");
			}

			const uploaded: Number[] = [];

			for (const file in files) {
				let hash = Utils.md5(account.getHash() + Date.now());
				const{ item } = await plannerDb.createFile({
					user_id: account.getUserId(),
					name: files[file].originalFilename,
					type: files[file].type,
					category: StorageFolderTypes.account,
					size: files[file].size,
					path: paths[file],
					hash
				})

				if (!item) throw new Validation.ResponseError("An error uploading an account reference file");

				uploaded.push(item.id)
			}
		

			files_ids = uploaded.join(",")
			
			
		}

		const accountData: CreateAccount = {
            account_id: account.getAccountId(),
            title: account.getTitle(),
            description: account.getDescription(),
            currency: account.getCurrency(),
            type: account.getAccountType(),
            balance: account.getBalance(),
            hash: account.getHash(),
            metadata: account.getMetadata(),
            primary: account.isPrimary(),
			user: {
				connect: {
					user_id: account.getUserId()
				}
			}
        };

		if (image_id) {
			accountData.image = {
				connect: {
					id: image_id
				}
			}
		}

		if (files_ids) {
			accountData.files = files_ids
		}

		if(account.isPrimary()) {
			await plannerDb.removeAccountPrimaryStatus()
		}
		
	
		return  await plannerDb.createAccount(accountData);
	};
}
