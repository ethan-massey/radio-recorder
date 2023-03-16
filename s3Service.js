const { 
  S3Client, 
  CreateMultipartUploadCommand, 
  CompleteMultipartUploadCommand, 
  UploadPartCommand,
  PutObjectCommand } = require("@aws-sdk/client-s3")
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

// Used for recordings less than 5MB
// (Multipart Upload doesn't allow chunks < 5MB)
const sendWholeFileToS3 = async (audioFile) => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: audioFile,
    Body: fs.readFileSync(`example-recordings/${audioFile}`)
  });

  try {
    console.info('Sending file to s3...')
    const response = await client.send(command);
    console.log(response);
  } catch (err) {
    console.error('Error sending file to s3')
    console.error(err);
  }
};

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

// public function to upload a file to S3
const uploadFileToS3 = async (fileName) => {
  const UploadId = await startMultipartUpload(fileName)
  const fileSizeInBytes = fs.statSync(`./example-recordings/${fileName}`).size
  const chunkSize = 5242880
  var numChunks = Math.floor(fileSizeInBytes / chunkSize)
  if (fileSizeInBytes % chunkSize !== 0){
    numChunks += 1
  }

  // Use single-command S3 upload (file is smaller than 5MB)
  if (numChunks === 1) {
    sendWholeFileToS3(fileName)
  // Use multi-part upload
  } else {
    console.log(`Expecting ${numChunks} chunks from local file stream: ${fileName}`)

    const readStream = fs.createReadStream(`./example-recordings/${fileName}`, {highWaterMark: chunkSize})
    // for storing ETag and part numbers to send to AWS in CompleteMultipartUploadCommand
    const parts = []
    // ID for current chunk being processed
    var chunkNo = 1
  
    // listen to "data" event for incoming chunks
    readStream.on('data', (chunk) => {
      // console.log(`${chunkNo} data: `, chunk, chunk.length);
      // console.log(`Received ${chunk.length} bytes of data. (chunk no ${chunkNo})`);
  
      readStream.pause()
      uploadChunk(fileName, chunk, chunkNo, UploadId).then((eTag) => {
        parts.push({
          ETag: eTag,
          PartNumber: chunkNo
        })
        console.log(`uploaded ${chunk.length} bytes of data. (Chunk No. ${chunkNo})`)
      }).then(async () => {
        // if on last chunk
        if (chunkNo === numChunks) {
          res = await finishMultiPartUpload(fileName, UploadId, parts)
          console.log('Success uploading file to S3')
          console.log(parts)
          console.log(res)
        // if on any other chunk
        } else {
          chunkNo += 1
          readStream.resume()
        }
      })
    });
  
    readStream.on('error', (err) => {
        console.log('error :', err)
    })
  }
}

module.exports = {
    uploadFileToS3
}
