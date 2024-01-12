const { uploadFileToS3 } = require('./s3Service')
require('log-timestamp')

uploadFileToS3('output.aac')
