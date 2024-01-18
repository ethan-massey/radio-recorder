const { uploadFileToS3 } = require("./s3Service");
require("log-timestamp");
const fs = require("fs");

try {
  // get recording file names
  var files = fs.readdirSync("recordings");

  if (files.length === 0) {
    console.log("No files found in recordings directory. Exiting...");
  } else {
    // upload to s3
    files.forEach((file) => {
      console.log(
        `Found file ${file} in recordings directory. Attempting upload.`
      );
      uploadFileToS3(file);
    });
  }
} catch (err) {
  console.log(err);
}
