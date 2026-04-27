FROM apify/actor-node:18

# Instalar dependencias necesarias
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    tar \
    libstdc++6 \
    libgcc-s1 \
    libespeak-ng1 \
    espeak-ng-data \
    && rm -rf /var/lib/apt/lists/*

# Crear carpeta para piper
WORKDIR /opt/piper

# Descargar Piper
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz -O piper.tar.gz \
    && tar -xzf piper.tar.gz \
    && chmod +x piper/piper

# Agregar al PATH
ENV PATH="/opt/piper/piper:${PATH}"

# Crear carpeta de modelos
RUN mkdir -p /opt/models

# Copiar modelo (asegúrate de que exista en tu proyecto)
COPY model.onnx /opt/models/model.onnx

# Volver al app
WORKDIR /app

# Copiar código
COPY . .

# Instalar dependencias node
RUN npm install

# Ejecutar
CMD ["node", "main.js"]
