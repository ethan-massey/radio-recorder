const { 
  S3Client, 
  CreateMultipartUploadCommand, 
  CompleteMultipartUploadCommand, 
  AbortMultipartUploadCommand,
  UploadPartCommand } = require("@aws-sdk/client-s3")
require('dotenv').config()
const fs = require('fs');

const S3_BUCKET = "daily-elliot-audio"

const client = new S3Client(
    {   region: "us-east-1",
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        }
    }
);

// Initiate multi-part upload and return UploadId
const startMultipartUpload = async (fileName) => {
  const command = new CreateMultipartUploadCommand({
    Bucket: S3_BUCKET,
    Key: fileName,
  });

  try{
    const response = await client.send(command);
    return response.UploadId
  } catch (err) {
    console.error(err)
    throw err
  }
}

// Upload individual Buffer to S3
const uploadChunk = async (fileName, chunk, chunkNumber, UploadId) => {
  const command = new UploadPartCommand({
    Body: chunk,
    Bucket: S3_BUCKET,
    Key: fileName,
    PartNumber: chunkNumber,
    UploadId: UploadId
  });
  try {
    const response = await client.send(command);
    return response.ETag
  } catch (err) {
    console.error(`Failed to upload chunk ${chunkNumber} to S3`)
    console.error(err)
    throw err
  }
}

// Notify S3 that all chunks have been uploaded
const finishMultiPartUpload = async (fileName, UploadId, Parts) => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: S3_BUCKET,
    Key: fileName,
    UploadId: UploadId,
    MultipartUpload: {
      Parts: Parts
    }
  });
  const response = await client.send(command);
  return response
}

const abortUpload = async (Bucket, fileName, UploadId) => {
  const command = new AbortMultipartUploadCommand({
    Bucket: Bucket,
    Key: fileName,
    UploadId: UploadId
  });
  const response = await client.send(command);
  return response
}

// public function
const uploadFileToS3 = async (fileName) => {
  const UploadId = await startMultipartUpload(fileName)

  const readStream = fs.createReadStream(`./example-recordings/${fileName}`, {highWaterMark: 5242880})
  // const data = [];
  const parts = []

  var chunkNo = 1
  readStream.on('data', (chunk) => {
    // data.push(chunk);
    // console.log(`${chunkNo} data: `, chunk, chunk.length);
    console.log(`Received ${chunk.length} bytes of data. (chunk no ${chunkNo})`);
    readStream.pause()
    uploadChunk(fileName, chunk, chunkNo, UploadId).then((eTag) => {
      parts.push({
        ETag: eTag,
        PartNumber: chunkNo
      })
      chunkNo += 1
    }).then(() => {
      readStream.resume()
    })
  });

  readStream.on('end', async () => {
      // console.log('end :', Buffer.concat(data).toString());
      console.log(parts)
      res = await finishMultiPartUpload(fileName, UploadId, parts)
      console.log('Success uploading file to S3')
  })

  readStream.on('error', (err) => {
      console.log('error :', err)
  })
}


uploadFileToS3('test.wav')

module.exports = {
    uploadFileToS3
}
