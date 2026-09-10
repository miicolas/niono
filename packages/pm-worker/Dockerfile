FROM docker:29.4.0-cli
RUN apk add --no-cache nodejs
WORKDIR /app
COPY *.mjs ./
ENV PM_WORKER_PORT=8090 PM_WORKER_DATA_DIR=/data/jobs
EXPOSE 8090
CMD ["node", "server.mjs"]
