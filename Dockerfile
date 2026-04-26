FROM apify/actor-node:18

# Alpine usa apk (no apt-get)
RUN apk add --no-cache \
    ffmpeg \
    wget \
    python3 \
    py3-pip

# Instalar Piper con versiones compatibles
RUN pip3 install --no-cache-dir \
    onnxruntime==1.17.3 \
    piper-tts==1.4.0 \
    --break-system-packages

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
