// Imports modules.
const fs = require('fs'), path = require('path')
const AudioRecorder = require('node-audiorecorder')
const { getFormattedCurrentDate } = require('./dateFormat')
const { setTimeout } = require("timers/promises")

// function to create audio recording and save audio file to output dir
const createRecording = async () => {
  // Constants.
  const DIRECTORY = 'recordings';

  // Create path to write recordings to.
  if (!fs.existsSync(DIRECTORY)) {
    fs.mkdirSync(DIRECTORY);
  }

  // Initialize recorder and file stream.
  const audioRecorder = new AudioRecorder({
    program: 'sox',
    rate: 44100, // 44.1kHz CD sample rate standard
    silence: 0,
    type: `mp3`, // Format type.
  }, console);

  // Log information on the following events.
  audioRecorder.on('error', function () {
    console.warn('Recording error.');
  });
  audioRecorder.on('end', function () {
    console.warn('Recording ended.');
  });

  // Create file path
  const fileName = [DIRECTORY,'/',getFormattedCurrentDate(),'.mp3'].join('')
  console.log('Writing new recording file at:', fileName);

  // Create write stream.
  const fileStream = fs.createWriteStream(fileName, { encoding: 'binary' });

  // Start and write to the file.
  audioRecorder.start().stream().pipe(fileStream);

  // Keep process alive.
  // process.stdin.resume(); I don't know what this is or why it was included

  console.log('Press ctrl+c to exit.');

  // Keep alive 5:45am to 11:00am
  await setTimeout(1000 * 60 * 60 * 5.25)

  audioRecorder.stop()
  
  // return filename of recording
  return fileName.replace(DIRECTORY + '/', '')
}

module.exports = {
  createRecording
}
