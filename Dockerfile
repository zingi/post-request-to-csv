FROM node:14.4-alpine3.12

# create folder for csv files
RUN mkdir /data

# add node dependencies
ADD package.json /usr/src/pr2csv/package.json
ADD package-lock.json /usr/src/pr2csv/package-lock.json
WORKDIR /usr/src/pr2csv
RUN npm i --production

# add code
ADD app /usr/src/pr2csv/app

ENTRYPOINT [ "npm", "start" ]