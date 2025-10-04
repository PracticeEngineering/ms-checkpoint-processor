FROM node:20-alpine AS dependencies
WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install


FROM dependencies AS builder
COPY . .

RUN yarn build


FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app

# --- MEJORA DE SEGURIDAD ---
# Creamos un grupo y un usuario de sistema sin privilegios llamados 'nodejs'
# Se usan UID/GID > 1000 que son típicamente para usuarios no privilegiados.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist

# --- MEJORA DE SEGURIDAD ---
# Cambiamos el propietario de todos los archivos de la aplicación a nuestro usuario sin privilegios.
# Esto es necesario para que el proceso pueda leer sus propios archivos.
RUN chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 3000
CMD ["node", "dist/main"]