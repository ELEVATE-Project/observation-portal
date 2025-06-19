FROM node:18 AS build

WORKDIR /app

RUN npm install -g @angular/cli@19.2.5

COPY package*.json ./
RUN npm install --force

COPY . .

RUN npm run build

FROM node:18 AS final

WORKDIR /usr/src/app

COPY --from=build /app/dist/observation-portal/browser /usr/src/app/dist

RUN npm install --force -g serve

COPY src/assets/env/env.js /usr/src/app/dist/assets/env/env.js

WORKDIR /usr/src/app/dist

EXPOSE 6006

CMD ["serve", "-s", ".", "-l", "6006"]