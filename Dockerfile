FROM apify/actor-node:18

USER root

# Dependencias
RUN apk update && apk add --no-cache \
    ffmpeg \
    bash \
    wget \
    ca-certificates \
    libstdc++ \
    curl \
    unzip

WORKDIR /app

# 🔥 Piper (FIX permisos + ruta correcta)
RUN mkdir -p /opt/piper && \
    wget -qO /opt/piper/piper.tar.gz https://github.com/rhasspy/piper/releases/latest/download/piper_linux_x86_64.tar.gz && \
    tar -xzf /opt/piper/piper.tar.gz -C /opt/piper && \
    find /opt/piper -type f -name "piper" -exec chmod +x {} \; && \
    find /opt/piper -type f -name "piper" -exec cp {} /usr/local/bin/piper \; && \
    chmod +x /usr/local/bin/piper && \
    rm /opt/piper/piper.tar.gz

# Modelos (con fallback)
RUN mkdir -p /opt/models && \
    (wget -qO /opt/models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx || \
     wget -qO /opt/models/model.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/amy/low/es_ES-amy-low.onnx) && \
    (wget -qO /opt/models/model.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json || \
     wget -qO /opt/models/model.json https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/amy/low/es_ES-amy-low.onnx.json)

ENV MODEL_PATH=/opt/models/model.onnx

COPY package*.json ./
RUN npm install --omit=dev

COPY . ./

CMD ["node", "main.js"]
