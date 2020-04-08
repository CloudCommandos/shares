Install dependencies
```
apt update
apt install -y python
apt install -y python-pip
apt install -y python-psycopg2
apt install -y libpq-dev
apt install -y nodejs
apt install -y npm
npm install -g serve
npm install -g webpack webpack-dev-server
```

### Backend Server
Assuming that the `backend_server` project folder is located at `/var/www`,
install backend server dependencies
```
cd /var/www/backend_server
pip install -r requirements.txt
```

Install Postgresql
```
apt install postgresql
```
Change to Postgresql user
```
sudo su - postgres
```
Access Postgresql from user `postgres`
```
psql
```
Set password for `postgres` user inside Postgresql
```
ALTER USER postgres PASSWORD 'myPassword';
```
Create MIB database
```
CREATE DATABASE mib;
```
Also execute the sql statements from the file 'sample_psql_init.txt' in the repository

Start the backend server in the background of a tmux session
```
cd /var/www/backend_server

tmux 
python IssMain.py &
```

Or start the backend server as a daemon

### Frontend Server
Assuming that the `frontend` project folder is located at `/var/www/`,
The project should already have been built, so start the frontend server in the background
```
cd /var/www/frontend/
serve -s build &
```
Or start the frontend server as a daemon
