FROM apify/actor-node:18

# Alpine usa apk, no apt-get
RUN apk add --no-cache \
    ffmpeg \
    wget \
    git \
    python3 \
    py3-pip \
    build-base

# Instalar Piper (binario)
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper \
    && rm piper_linux_x86_64.tar.gz

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

CMD ["node", "main.js"]
