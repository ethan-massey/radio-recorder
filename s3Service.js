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
  const fileSizeInBytes = fs.statSync(`./example-recordings/${fileName}`).size
  const chunkSize = 5242880
  var numChunks = Math.floor(fileSizeInBytes / chunkSize)
  if (fileSizeInBytes % chunkSize !== 0){
    numChunks += 1
  }
  console.log(`num chunks is ${numChunks}`)

  const readStream = fs.createReadStream(`./example-recordings/${fileName}`, {highWaterMark: chunkSize})
  const parts = []
  let latest

  var chunkNo = 1

  readStream.on('data', (chunk) => {
    // console.log(`${chunkNo} data: `, chunk, chunk.length);
    // console.log(`Received ${chunk.length} bytes of data. (chunk no ${chunkNo})`);

    const upload = () => {
      return new Promise((resolve, reject) => {
        readStream.pause()
        uploadChunk(fileName, chunk, chunkNo, UploadId).then((eTag) => {
          parts.push({
            ETag: eTag,
            PartNumber: chunkNo
          })
          console.log(`uploaded ${chunk.length} bytes of data. (Chunk no ${chunkNo})`)
          chunkNo += 1
        }).then(() => {
          readStream.resume()
          resolve()
        })
      })
    }

    // all chunks other than last two
    if (chunkNo < numChunks - 1){
      upload()
    // penultimate chunk
    } else if (chunkNo === numChunks - 1){
      console.log('skipping 2nd to last (combine with last)')
      chunkNo += 1
      latest = chunk
    // final chunk
    } else if (chunkNo === numChunks) {
      chunk = Buffer.concat([latest, chunk])
      upload().then(async () => {
        res = await finishMultiPartUpload(fileName, UploadId, parts)
        console.log('Success uploading file to S3')
        console.log(res)
      })
    }
  });

  readStream.on('error', (err) => {
      console.log('error :', err)
  })
}

module.exports = {
    uploadFileToS3
}
