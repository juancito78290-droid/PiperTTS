FROM node:18-bullseye-slim

ENV NODE_ENV=production
ENV APIFY_LOCAL_STORAGE_DIR=/home/myuser/apify_storage

RUN groupadd -r myuser && useradd -r -g myuser -m -d /home/myuser myuser

WORKDIR /home/myuser

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    libstdc++6 \
    libgomp1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/local/piper && \
    curl -L \
        --user-agent "Mozilla/5.0 (X11; Linux x86_64)" \
        --retry 3 \
        --retry-delay 5 \
        --max-time 120 \
        -o /tmp/piper.tar.gz \
        "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz" && \
    tar -xzf /tmp/piper.tar.gz -C /usr/local/piper --strip-components=1 && \
    rm /tmp/piper.tar.gz && \
    chmod +x /usr/local/piper/piper && \
    ln -sf /usr/local/piper/piper /usr/local/bin/piper

RUN mkdir -p /usr/local/piper/voices && \
    curl -L \
        --user-agent "Mozilla/5.0 (X11; Linux x86_64)" \
        --retry 3 \
        --retry-delay 5 \
        --max-time 120 \
        -o /usr/local/piper/voices/es_ES-mls_10246-low.onnx \
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx" && \
    curl -L \
        --user-agent "Mozilla/5.0 (X11; Linux x86_64)" \
        --retry 3 \
        --retry-delay 5 \
        --max-time 60 \
        -o /usr/local/piper/voices/es_ES-mls_10246-low.onnx.json \
        "https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json"

RUN test -s /usr/local/piper/voices/es_ES-mls_10246-low.onnx && \
    test -s /usr/local/piper/voices/es_ES-mls_10246-low.onnx.json

RUN chown -R myuser:myuser /home/myuser /usr/local/piper

COPY --chown=myuser:myuser package.json ./
RUN npm install --omit=dev --no-optional

COPY --chown=myuser:myuser . ./

USER myuser

CMD ["node", "main.js"]
