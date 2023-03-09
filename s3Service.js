const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3")
require('dotenv').config()

const client = new S3Client(
    {   region: "us-east-1",
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        }
    }
);

const sendRecordingToS3 = async (audioFile) => {
  const command = new PutObjectCommand({
    Bucket: "daily-elliot-audio",
    Key: audioFile.filename,
    Body: audioFile.buffer
  });

  try {
    const response = await client.send(command);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
    sendRecordingToS3
}
