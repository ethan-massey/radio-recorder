const { createRecording } = require('./recordService')
const { sendRecordingToS3 } = require('./s3Service')
require('log-timestamp')

createRecording().then((fileName) => {
    sendRecordingToS3(fileName)
})

