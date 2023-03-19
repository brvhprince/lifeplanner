import {
	S3Client,
	PutObjectCommand,
	PutObjectCommandInput,
	DeleteObjectCommand,
	DeleteObjectsCommand,
	DeleteObjectsCommandInput,
	DeleteObjectCommandInput,
	CreateBucketCommand,
	ListBucketsCommand
} from "@aws-sdk/client-s3";
import {
	FileInput,
	LocalMultipleFiles,
	S3MultipleFiles,
	StorageFolderTypes,
	DbFile
} from "../types";
import { readFileSync, existsSync, mkdirSync, copyFile, unlinkSync } from "fs";
import path from "path";
import { generateReference } from "./utils";

export const uploadFile = async (file: FileInput, type: StorageFolderTypes) => {
	const fileExtension = file.originalFilename.split(".").pop();
	const name = `${generateReference()}.${fileExtension}`;

	const fileData = readFileSync(file.path);

	let path: string | false;

	if (String(process.env.STORAGE).toUpperCase() === "S3") {
		const destinationPath = `${type}/${name}`;
		path = await uploadFileToS3(destinationPath, fileData);
	} else if (process.env.STORAGE === "local") {
		path = await uploadFileToLocal(type, name, file.path);
	} else {
		path = false;
	}

	unlinkFile(file.path);

	return path;
};

export const uploadFiles = async (
	files: FileInput[],
	type: StorageFolderTypes
) => {
	let paths: string[] | false;

	if (String(process.env.STORAGE).toUpperCase() === "S3") {
		const s3Files: S3MultipleFiles[] = [];

		for (const file of files) {
			const fileExtension = file.originalFilename.split(".").pop();
			const name = `${generateReference()}.${fileExtension}`;
			const fileData = readFileSync(file.path);
			const destinationPath = `${type}/${name}`;

			s3Files.push({
				name: destinationPath,
				data: fileData
			});
		}

		paths = await uploadFilesToS3(s3Files);
	} else if (process.env.STORAGE === "local") {
		const localFiles: LocalMultipleFiles[] = [];

		for (const file of files) {
			const fileExtension = file.originalFilename.split(".").pop();
			const name = `${generateReference()}.${fileExtension}`;

			localFiles.push({
				name,
				path: file.path
			});
		}

		paths = await uploadFilesToLocal(type, localFiles);
	} else {
		paths = false;
	}

	files.forEach((file) => {
		unlinkFile(file.path);
	});

	return paths;
};

export const deleteFiles = async (files: DbFile | DbFile[]) => {
	let response = false;
	if (String(process.env.STORAGE).toUpperCase() === "S3") {
		if (Array.isArray(files)) {
			const keys: string[] = [];

			for (const file of files) {
				const key = extractKeyFromUrl(file.path);
				keys.push(key);
			}

			response = await deleteFilesFromS3(keys);
		} else {
			const key = extractKeyFromUrl(files.path);
			response = await deleteFileFromS3(key);
		}
	} else if (process.env.STORAGE === "local") {
		const basePath = path.join(
			__dirname,
			"../",
			String(process.env.LOCAL_FOLDER_NAME)
		);
		if (Array.isArray(files)) {
			for (const file of files) {
				const key = path.join(basePath, extractKeyFromUrl(file.path));
				response = unlinkFile(key);
			}
		} else {
			const key = path.join(basePath, extractKeyFromUrl(files.path));
			response = unlinkFile(key);
		}
	} else {
		response = false;
	}

	return response;
};

const uploadFileToLocal = (
	type: string,
	fileName: string,
	filePath: string
) => {
	const folder = `${process.env.LOCAL_FOLDER_NAME}/${type}`;
	const folderPath = path.join(__dirname, "../", folder);

	if (!existsSync(folderPath)) {
		mkdirSync(folderPath, { recursive: true });
	}

	const fileDestination = path.join(folderPath, fileName);

	copyFile(filePath, fileDestination, (err) => {
		if (err) {
			console.log(`An error occurred uploading ${fileName}`, { err });
			throw err;
		}
	});

	return `${process.env.APP_URL}/static/${type}/${fileName}`;
};

const uploadFilesToLocal = (type: string, files: LocalMultipleFiles[]) => {
	const folder = `${process.env.LOCAL_FOLDER_NAME}/${type}`;
	const folderPath = path.join(__dirname, "../", folder);

	if (!existsSync(folderPath)) {
		mkdirSync(folderPath, { recursive: true });
	}

	const fileDestinations = [];
	for (const file of files) {
		const { name: fileName, path: filePath } = file;

		const fileDestination = path.join(folderPath, fileName);

		copyFile(filePath, fileDestination, (err) => {
			if (err) {
				console.log(`An error occurred uploading ${fileName}`, { err });
				throw err;
			}
		});

		fileDestinations.push(
			`${process.env.APP_URL}/static/${folder}/${fileName}`
		);
	}

	return fileDestinations;
};

const getClientAndBucket = async () => {
	const s3Client = new S3Client({
		region: String(process.env.AWS_REGION),
		credentials: {
			accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
			secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY)
		}
	});

	const bucketName = String(process.env.AWS_BUCKET_NAME);

	// Check if the bucket exists, create it if it doesn't
	const { Buckets: buckets } = await s3Client.send(new ListBucketsCommand({}));
	const bucketExists = buckets
		? buckets.some((bucket) => bucket.Name === bucketName)
		: false;

	if (!bucketExists) {
		const createBucketCommand = new CreateBucketCommand({ Bucket: bucketName });
		await s3Client.send(createBucketCommand);
	}

	return { s3Client, bucketName };
};

const uploadFileToS3 = async (fileName: string, fileData: Buffer) => {
	try {
		const { s3Client, bucketName } = await getClientAndBucket();

		// Set up the parameters for the PutObjectCommand
		const params: PutObjectCommandInput = {
			Bucket: bucketName,
			Key: fileName,
			Body: fileData,
			ACL: "public-read"
		};

		const command = new PutObjectCommand(params);

		// Upload the file to S3
		await s3Client.send(command);

		return generateS3Url(fileName);
	} catch (error) {
		console.error("Error uploading file to S3", { error });

		return false;
	}
};

const uploadFilesToS3 = async (files: S3MultipleFiles[]) => {
	try {
		const { s3Client, bucketName } = await getClientAndBucket();

		const uploadPromises = [];

		// Upload the file to S3
		for (const file of files) {
			const { name: fileName, data: fileData } = file;

			// Set up the parameters for the PutObjectCommand
			const params: PutObjectCommandInput = {
				Bucket: bucketName,
				Key: fileName,
				Body: fileData,
				ACL: "public-read"
			};

			// Upload the file to S3 and push the promise to uploadPromises
			const putCommand = new PutObjectCommand(params);
			const uploadPromise = s3Client.send(putCommand);
			uploadPromises.push(uploadPromise);
		}

		// Wait for all files to be uploaded
		await Promise.allSettled(uploadPromises);

		const objectUrls = [];

		for (const file of files) {
			const { name: fileName } = file;
			const objectUrl = generateS3Url(fileName);
			objectUrls.push(objectUrl);
		}

		return objectUrls;
	} catch (error) {
		console.error("Error uploading file to S3", { error });

		return false;
	}
};

const deleteFilesFromS3 = async (keys: string[]) => {
	try {
		const { s3Client, bucketName } = await getClientAndBucket();

		// Set up the parameters for the DeleteObjectsCommand
		const params: DeleteObjectsCommandInput = {
			Bucket: bucketName,
			Delete: {
				Objects: keys.map((key) => ({ Key: key }))
			}
		};

		await s3Client.send(new DeleteObjectsCommand(params));
		return true;
	} catch (error) {
		console.error(`Error deleting file ${keys.toString()} from S3 bucket`, {
			error
		});
		return false;
	}
};

const deleteFileFromS3 = async (key: string) => {
	try {
		const { s3Client, bucketName } = await getClientAndBucket();

		// Set up the parameters for the DeleteObjectCommand
		const params: DeleteObjectCommandInput = {
			Bucket: bucketName,
			Key: key
		};

		await s3Client.send(new DeleteObjectCommand(params));
		return true;
	} catch (error) {
		console.error(`Error deleting file ${key} from S3 bucket`, { error });
		return false;
	}
};

const generateS3Url = (fileName: string) => {
	const region = String(process.env.AWS_REGION);
	const bucket = String(process.env.AWS_BUCKET_NAME);
	const regionString = region === "us-east-1" ? "" : "." + region;
	return `https://${bucket}.s3${regionString}.amazonaws.com/${fileName}`;
};

const unlinkFile = (path: string) => {
	if (existsSync(path)) {
		unlinkSync(path);
		return true;
	}
	return false;
};

const extractKeyFromUrl = (url: string) => {
	const match = url.match(/(https?:\/\/[^/]+\/(?:static\/)?)(.*)/);
	if (match && match.length > 2) {
		return match[2];
	}
	return "";
};
