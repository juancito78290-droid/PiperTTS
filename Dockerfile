FROM apify/actor-node:18

# Instalar ffmpeg + piper
RUN apt-get update && apt-get install -y ffmpeg wget

# Instalar piper
RUN wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz \
 && tar -xzf piper_amd64.tar.gz \
 && mv piper /usr/local/bin/piper

# Crear carpeta modelos
RUN mkdir -p /models

# Descargar modelo MLS10246
RUN wget -O /models/es_ES-mls_10246-low.onnx \
https://huggingface.co/rhasspy/piper-voices/resolve/main/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx

WORKDIR /app
COPY . . 

CMD ["node", "main.js"]
