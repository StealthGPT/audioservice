#!/bin/sh

INPUT_FILE="audio.mp3"
OUTPUT_FILE="audio.ogg"

ffmpeg -i "$INPUT_FILE" -vn -map_metadata -1 -ac 1 -c:a libopus -b:a 12k -application voip "$OUTPUT_FILE"

echo "Compression completed: $OUTPUT_FILE"
