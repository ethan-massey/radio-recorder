const { createRecording } = require('./recordService')
const { uploadFileToS3 } = require('./s3Service')
require('log-timestamp')

createRecording().then((fileName) => {
    uploadFileToS3(fileName)
})

