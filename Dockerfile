FROM node:18 AS build

WORKDIR /app

RUN npm install -g @angular/cli@19.2.5

COPY package*.json ./
RUN npm install --force

COPY . .
RUN ng build --base-href /observations/

FROM node:18 AS final

WORKDIR /usr/src/app

COPY --from=build /app/dist/observation-portal/browser /usr/src/app/dist

RUN npm install --force -g serve


WORKDIR /usr/src/app/dist

EXPOSE 6006

CMD ["serve", "-s", ".", "-l", "6006"]