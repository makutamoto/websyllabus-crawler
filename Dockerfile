FROM node:12

RUN apt update && apt install -y cron
RUN echo '0 0 1 * * root /usr/src/app/crawler.sh' >> /etc/crontab

WORKDIR /usr/src/app/
COPY ./docker/execcron.sh ./
COPY ./docker/crawler.sh ./

COPY package*.json ./
RUN npm install
COPY ./dist ./dist

CMD ["./execcron.sh"]
