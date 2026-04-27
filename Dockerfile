FROM apify/actor-node:18

USER root

# Alpine usa apk, NO apt-get
RUN apk update && apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    git \
    wget \
    bash

# Clonar Piper
RUN git clone https://github.com/rhasspy/piper /piper

WORKDIR /piper

# Instalar dependencias de Piper
RUN pip3 install -r requirements.txt

WORKDIR /usr/src/app

COPY . ./

RUN npm install

CMD ["node", "main.js"]
