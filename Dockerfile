FROM apify/actor-node:18

USER root

# 🔥 Dependencias necesarias (evita errores de runtime)
RUN apk update && apk add --no-cache \
    ffmpeg \
    bash \
    wget \
    ca-certificates \
    libstdc++ \
    curl \
    unzip

# 🔥 Carpeta de trabajo
WORKDIR /app

# 🔥 Descargar Piper (VERSIÓN ESTABLE + fallback)
RUN mkdir -p /opt/piper && \
    wget -qO /opt/piper/piper.tar.gz https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz || \
    wget -qO /opt/piper/piper.tar.gz https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_linux_x86_64.tar.gz && \
    tar -xzf /opt/piper/piper.tar.gz -C /opt/piper && \
    chmod +x /opt/piper/piper && \
    rm /opt/piper/piper.tar.gz

# 🔥 Descargar modelo (con fallback REAL)
RUN mkdir -p /opt/models && \
    (wget -qO /opt/models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx || \
     wget -qO /opt/models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/amy/low/es_ES-amy-low.onnx) && \
    (wget -qO /opt/models/model.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json || \
     wget -qO /opt/models/model.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/amy/low/es_ES-amy-low.onnx.json)

# 🔥 Variables (evita rutas rotas)
ENV PIPER_BIN=/opt/piper/piper
ENV MODEL_PATH=/opt/models/model.onnx

# 🔥 Copiar código
COPY package*.json ./
RUN npm install --omit=dev

COPY . ./

# 🔥 Permisos
RUN chmod +x /opt/piper/piper

CMD ["node", "main.js"]
