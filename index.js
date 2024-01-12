const { uploadFileToS3 } = require('./s3Service')
require('log-timestamp')
const fs = require('fs');

try {
    // get recording file names
    var files = fs.readdirSync('/home/pi/Desktop/radio-recorder/recordings/');
    // upload to s3
    files.forEach(file => {
        uploadFileToS3(file)
    })
} catch (err) {
    console.error(err)
}
