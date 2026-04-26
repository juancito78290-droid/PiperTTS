FROM apify/actor-node:20

# ffmpeg para convertir a mp3
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# instalar piper
RUN pip install --no-cache-dir piper-tts

# copiar proyecto
COPY . ./

CMD ["node", "main.js"]
