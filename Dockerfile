FROM node:18 as builder
ADD . /app
ENV NODE_ENV=production
WORKDIR /app
RUN npm install 

FROM gcr.io/distroless/nodejs18-debian11
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/server.js /app/server.js
COPY --from=builder /app/src /app/src
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/healthcheck.js /app/healthcheck.js

# The healthcheck can be run from here, but also from the compose file
# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD ["/nodejs/bin/node", "app/healthcheck.js"]

CMD ["app/server.js"]

EXPOSE 4006

