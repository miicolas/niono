FROM node:24-bookworm-slim@sha256:ba849c60be29959425b8734d57b8b4b7d56f98edd9504c9af091d5281095a71e
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/python && /opt/python/bin/pip install --no-cache-dir pandas==2.3.3 numpy==2.3.4 scipy==1.16.3 matplotlib==3.10.7 Pillow==12.0.0 openpyxl==3.1.5 pypdf==6.1.3
WORKDIR /opt/runner
RUN npm install --save-exact esbuild@0.25.12 react@19.2.8 react-dom@19.2.8 jszip@3.10.1 playwright@1.58.2 && npx playwright install --with-deps chromium && chmod -R a+rX /root/.cache/ms-playwright && mv /root/.cache/ms-playwright /opt/browsers
COPY execute.mjs collect-outputs.mjs ./
ENV PATH=/opt/python/bin:$PATH NODE_PATH=/opt/runner/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/browsers MPLCONFIGDIR=/tmp/matplotlib HOME=/tmp
RUN mkdir /work && chown 10001:10001 /work
USER 10001:10001
WORKDIR /work
CMD ["node", "/opt/runner/execute.mjs"]
