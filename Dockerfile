FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined at build time; BACKEND_URL is read when the server starts
# for rewrites, so it is also needed here because rewrites are evaluated during `next build`.
ARG NEXT_PUBLIC_ADK_API_BASE_URL=/svc/adk
ARG NEXT_PUBLIC_CONTEXT_API_URL=
ARG NEXT_PUBLIC_AGENT_LIBRARY_API_URL=
ARG BACKEND_URL=
ENV NEXT_PUBLIC_ADK_API_BASE_URL=$NEXT_PUBLIC_ADK_API_BASE_URL \
    NEXT_PUBLIC_CONTEXT_API_URL=$NEXT_PUBLIC_CONTEXT_API_URL \
    NEXT_PUBLIC_AGENT_LIBRARY_API_URL=$NEXT_PUBLIC_AGENT_LIBRARY_API_URL \
    BACKEND_URL=$BACKEND_URL

RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 8080
CMD ["node", "server.js"]
