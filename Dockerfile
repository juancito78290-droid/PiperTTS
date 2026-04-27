FROM apify/actor-node:18

USER root

# Instalar dependencias correctamente
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Clonar Piper
RUN git clone https://github.com/rhasspy/piper /piper

WORKDIR /piper

# Instalar Piper
RUN pip3 install -r requirements.txt

WORKDIR /usr/src/app

# Copiar tu código
COPY . ./

# Instalar dependencias Node
RUN npm install

CMD ["node", "main.js"]
