FROM node:18-bullseye

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    ca-certificates \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Descargar Piper
WORKDIR /app
RUN wget https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz && \
    tar -xzf piper_linux_x86_64.tar.gz && \
    mv piper /usr/local/bin/piper && \
    chmod +x /usr/local/bin/piper

# Descargar modelo correcto (mls_10246 LOW)
RUN mkdir -p /models && \
    wget -O /models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx && \
    wget -O /models/model.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json

# Copiar app
COPY package.json .
RUN npm install

COPY main.js .

# Puerto
EXPOSE 3000

CMD ["node", "main.js"]
