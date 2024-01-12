#!/bin/sh
cd /home/ethan/Desktop/radio-recorder
ffmpeg -i http://stream.revma.ihrhls.com/zc2525 -t 00:02:00 /home/ethan/Desktop/radio-recorder/recordings/$(date +%Y-%m-%dT%H-%M-%S).mp3
npm run start-cron >> log
