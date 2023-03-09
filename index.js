const { createRecording } = require('./recordService')
const { sendRecordingToS3 } = require('./s3Service')

createRecording().then((fileName) => {
    sendRecordingToS3(fileName)
})

