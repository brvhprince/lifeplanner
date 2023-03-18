import { S3Client, PutObjectCommand, PutObjectCommandInput, CreateBucketCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import { FileInput, LocalMultipleFiles, S3MultipleFiles, StorageFolderTypes } from "../types";
import { readFileSync, existsSync, mkdirSync, copyFile } from "fs";
import path from "path";
import { generateReference } from "./utils";

export const uploadFile = async (file:FileInput, type: StorageFolderTypes) => {

    const fileExtension = file.originalFilename.split(".").pop();
    const name = `${generateReference()}.${fileExtension}`;

    const fileData = readFileSync(file.path);

    let path: string | false;

    if (String(process.env.STORAGE).toUpperCase() === "S3") {
        const destinationPath = `${type}/${name}`;
        path = await uploadFileToS3(destinationPath, fileData)

    }
    else if(process.env.STORAGE === "local") {
        path = await uploadFileToLocal(type, name, file.path)
    }
    else {
        path = false;
    }

    return path

}

const uploadFileToLocal = (type: string, fileName: string, filePath: string) => {
   
    const folder = `${process.env.LOCAL_FOLDER_NAME}/${type}`;
    const folderPath = path.join(__dirname, "../", folder);
  
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
  
    const fileDestination = path.join(folderPath, fileName);
  
    copyFile(filePath, fileDestination, (err) => {
        if (err) {
            console.log(`An error occurred uploading ${fileName}`, {err})
            throw err
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
                console.log(`An error occurred uploading ${fileName}`, {err})
                throw err
            }
        
        });

        fileDestinations.push(`${process.env.APP_URL}/static/${folder}/${fileName}`)

    }

    return fileDestinations
   
  };


const getClientAndBucket = async () => {
    const s3Client = new S3Client({
        region: String(process.env.AWS_REGION),
        credentials: {
            accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
            secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY)
        } 
    });

    const bucketName = String(process.env.AWS_BUCKET_NAME)

    // Check if the bucket exists, create it if it doesn't
    const { Buckets: buckets } = await s3Client.send(new ListBucketsCommand({}));
    const bucketExists = buckets ? buckets.some(bucket => bucket.Name === bucketName): false;
    
    if (!bucketExists) {
      const createBucketCommand = new CreateBucketCommand({ Bucket: bucketName });
      await s3Client.send(createBucketCommand);

    }

    return { s3Client, bucketName }

}
 
const uploadFileToS3 = async (fileName: string, fileData: Buffer) => {


      try {

        const { s3Client, bucketName } = await getClientAndBucket()

  
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
        console.error(`Error uploading file to S3`, {error});
    
       return false;
      }
    
}
 
const uploadFilesToS3 = async (files: S3MultipleFiles[]) => {


      try {

        const { s3Client, bucketName } = await getClientAndBucket()

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
          const objectUrl =generateS3Url(fileName);
          objectUrls.push(objectUrl);
        }

        return objectUrls;
    

      } catch (error) {
        console.error(`Error uploading file to S3`, {error});
    
       return false;
      }
    
}

const generateS3Url = (fileName: string) => {
    const region = String(process.env.AWS_REGION)
    const bucket = String(process.env.AWS_BUCKET_NAME)
    const regionString = region === 'us-east-1' ?'':('.' + region)
    return `https://${bucket}.s3${regionString}.amazonaws.com/${fileName}`
};


export const uploadFiles = async (files:FileInput[], type: StorageFolderTypes) => {
   

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
            })
        }
       
        paths = await uploadFilesToS3(s3Files)

    }
    else if(process.env.STORAGE === "local") {
        const localFiles: LocalMultipleFiles[] = []; 
       
        for (const file of files) {
            
            const fileExtension = file.originalFilename.split(".").pop();
            const name = `${generateReference()}.${fileExtension}`;
           

            localFiles.push({
                name,
                path: file.path
            })
        }
       
        paths = await uploadFilesToLocal(type, localFiles)
    }
    else {
        paths = false;
    }

    return paths;
}