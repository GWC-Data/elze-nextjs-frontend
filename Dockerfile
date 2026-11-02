FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined at build time; BACKEND_URL is read when the server starts
# for rewrites, so it is also needed here because rewrites are evaluated during `next build`.
ARG NEXT_PUBLIC_CONTEXT_API_URL=
ARG NEXT_PUBLIC_AGENT_LIBRARY_API_URL=
ARG BACKEND_URL=
ENV NEXT_PUBLIC_CONTEXT_API_URL=$NEXT_PUBLIC_CONTEXT_API_URL \
    NEXT_PUBLIC_AGENT_LIBRARY_API_URL=$NEXT_PUBLIC_AGENT_LIBRARY_API_URL \
    BACKEND_URL=$BACKEND_URL

RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ARG BACKEND_URL=
# ADK_API_URL and ADK_API_KEY (the agent service and its key) are runtime settings of this
# server: /svc/adk/* is proxied through the backend's agent gate, which checks access and credits.
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0 BACKEND_URL=$BACKEND_URL
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 8080
CMD ["node", "server.js"]
