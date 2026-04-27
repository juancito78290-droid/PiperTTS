FROM apify/actor-node:18

USER root

# Paquetes mínimos + estables
RUN apk update && apk add --no-cache \
    ffmpeg \
    bash \
    wget \
    ca-certificates \
    libstdc++

# Crear carpeta Piper
RUN mkdir -p /opt/piper

# Descargar Piper binario estable
RUN wget -O /opt/piper/piper.tar.gz \
    https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz && \
    tar -xzf /opt/piper/piper.tar.gz -C /opt/piper && \
    chmod +x /opt/piper/piper && \
    rm /opt/piper/piper.tar.gz

# Descargar modelo español (ligero)
RUN wget -O /opt/piper/model.onnx \
    https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PIPER_PATH=/opt/piper/piper
ENV MODEL_PATH=/opt/piper/model.onnx

CMD ["node", "main.js"]
