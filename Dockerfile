# Usa imagen oficial válida de Apify
FROM apify/actor-node:18

# Instalar dependencias necesarias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    git \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper (binario precompilado)
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && mv piper /usr/local/bin/piper \
    && chmod +x /usr/local/bin/piper \
    && rm piper_linux_x86_64.tar.gz

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos del proyecto
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Comando de inicio
CMD ["node", "main.js"]
