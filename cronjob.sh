#!/bin/sh
cd /home/ethan/Desktop/radio-recorder
ffmpeg -i http://stream.revma.ihrhls.com/zc2525 -t 05:30:00 /home/ethan/Desktop/radio-recorder/recordings/$(date +%Y-%m-%dT%H-%M-%S).mp3 >> log
npm run start-cron >> log
