FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined at build time.
ARG NEXT_PUBLIC_CONTEXT_API_URL=
ARG NEXT_PUBLIC_AGENT_LIBRARY_API_URL=
ENV NEXT_PUBLIC_CONTEXT_API_URL=$NEXT_PUBLIC_CONTEXT_API_URL \
    NEXT_PUBLIC_AGENT_LIBRARY_API_URL=$NEXT_PUBLIC_AGENT_LIBRARY_API_URL

RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
# Runtime settings of this server, read on every request (set them on the Cloud Run service):
# BACKEND_URL is the Node backend that /api/* is proxied to (src/app/api/[...path]).
# ADK_API_URL and ADK_API_KEY are the agent service and its key: /svc/adk/* is proxied
# through the backend's agent gate, which checks access and credits.
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 8080
CMD ["node", "server.js"]
