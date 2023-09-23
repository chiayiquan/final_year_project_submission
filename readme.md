# Introduction

## Prerequisite
<b>Required</b>

- Psql: https://www.postgresql.org/download/
- Ganache(local blockchain): https://trufflesuite.com/ganache/
- Node.js: https://nodejs.org/en

<b>Optional</b>
- PgAdmin: https://www.pgadmin.org/download/

## Install All Dependencies
1. Open backend folder
2. Open terminal or git bash terminal
3. Run the following command
   - npm i --legacy-peer-deps
4. Open frontend folder
5. Open terminal or git bash terminal
6. Run the following command
   - npm i
  
## Setting Up Database
### Psql Command Line
1. Open psql terminal and log into the default user(postgres)
2. Create Databases
   - CREATE DATABASE "sharethemeal-development";
   - CREATE DATABASE "sharethemeal-test";
3. Create User and Grant Permission
   - CREATE USER sharethemeal WITH PASSWORD '123456';
   - ALTER ROLE sharethemeal CREATEDB;
   - GRANT ALL PRIVILEGES ON DATABASE "sharethemeal-development" TO sharethemeal;
   - GRANT ALL PRIVILEGES ON DATABASE "sharethemeal-test" TO sharethemeal;
   - ALTER DATABASE "sharethemeal-development" OWNER TO sharethemeal;
   - ALTER DATABASE "sharethemeal-test" OWNER TO sharethemeal;
4. Open the backend folder 
5. If you are using windows
   - Right click and select "Git Bash Here" option
6. If you are using linux system
   - Right click and open terminal
7. Run the following command
   - npm run db:migrate
8. Tables and seed data should be inserted into the databases

## Setting Up Ganache
1. Open Ganache
2. Click "New Workspace" Button
3. Click on "ACCOUNTS & KEYS" menu on the top
4. Change the value of "TOTAL ACCOUNTS TO GENERATE" to 50
5. Paste the following mnemonic into the "Enter the Mnemonic you wish to use" field
   - what daring crisp pitch scrap pony used modify club flavor nothing skill
6. Click on "Start" Button at the top

## Running Test Case
1. Open the terminal or git bash terminal in backend
2. Run the following command
   - npm test

## (Optional) To Scan QR Code With Phone
1. Open terminal or git bash terminal in frontend
2. Run the following command
   - npm start
3. Copy the Network IP address (http://192.168.1.x) without the port(this is your pc current ip assigned by your wifi router)
4. Stop the process by pressing ctrl c
5. In frontend directory, navigate to env folder and open .env.development
6. Replace the VITE_BACKEND_URL value to your network ip address from http://localhost:8080 to http://192.168.1.x:8080
7. Open backend folder, navigate to env folder and open .env.development
8. Replace the FRONT_END_URL value to your network ip address from http://localhost:5173 to http://192.168.1.x:5173
9. Replace the API_URL value to your network ip address from http://localhost:8080 to http://192.168.1.x:8080

## Running The Application
1. Open terminal or git bash terminal in backend
2. Run the following command
   - npm start
3. Open terminal or git bash terminal in frontend
4. Run the following command
   - npm start

