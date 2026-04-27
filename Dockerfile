FROM node:18-bullseye

# Instalar dependencias reales
RUN apt-get update && apt-get install -y \
    wget \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Instalar Piper limpio
RUN rm -rf /opt/piper && mkdir -p /opt/piper

RUN wget -q https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz \
    && tar -xzf piper_linux_x86_64.tar.gz \
    && cp -r piper/* /opt/piper/ \
    && chmod +x /opt/piper/piper \
    && rm -rf piper piper_linux_x86_64.tar.gz

# Descargar modelo
RUN mkdir -p /models \
    && wget -q https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx -O /models/model.onnx

ENV PATH="/opt/piper:$PATH"

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "main.js"]
