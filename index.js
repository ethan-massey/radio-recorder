// Imports modules.
const fs = require('fs'), path = require('path')
const AudioRecorder = require('node-audiorecorder')
const { getFormattedCurrentDate } = require('./dateFormat')

// Constants.
const DIRECTORY = 'example-recordings';

// Create path to write recordings to.
if (!fs.existsSync(DIRECTORY)) {
  fs.mkdirSync(DIRECTORY);
}

// Initialize recorder and file stream.
const audioRecorder = new AudioRecorder({
  program: 'sox',
  rate: 44100, // 44.1kHz CD sample rate standard
  silence: 0
}, console);

// Log information on the following events.
audioRecorder.on('error', function () {
  console.warn('Recording error.');
});
audioRecorder.on('end', function () {
  console.warn('Recording ended.');
});

// Create file path
const fileName = [DIRECTORY,'/',getFormattedCurrentDate(),'.wav'].join('')
console.log('Writing new recording file at:', fileName);

// Create write stream.
const fileStream = fs.createWriteStream(fileName, { encoding: 'binary' });

// Start and write to the file.
audioRecorder.start().stream().pipe(fileStream);

// Keep process alive.
process.stdin.resume();
console.warn('Press ctrl+c to exit.');

// Keep alive for 3 hours
setTimeout(() => {
  process.exit()
}, 1000 * 60 * 60 * 3)
