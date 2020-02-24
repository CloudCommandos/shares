# Ansible Foundation Workshop Hands-On Guide
This article is a step-by-step guide for the hands-on session included in the Ansible Foundation Workshop conducted by ESD PSS Infra department. This hands-on session serves to teach you how to write simple Ansible Playbooks. The knowledge gained shall build the foundation necessary to utilise Ansible's various features and modules for complex use cases.


## 1. Setup Ansible
Ansible can be used to configure any target system that supports the SSH protocol and Python 2/3 library. However, Ansible's control node can only run on Unix OS (Ubuntu, MacOS, Red Hat, etc.). For this workshop, an Ubuntu 18.04 VM with Ansible is already prepared for you.

### 1.1 (Optional) Install Ansible
To install Ansible on an Ubuntu 18.04 VM, run the following commands as a sudo user:
```bash
sudo apt-add-repository ppa:ansible/ansible
sudo apt update
sudo apt install ansible
```


<div style="page-break-after: always;"></div>

## 2. Access Ansible Host Remotely
### 2.1 For Windows PC
1. Install software PuTTY  

   <img src="images/PuTTY.jpg" width="150">

1. Run PuTTY and start a session with the following settings:  

   *  Host Name: 111.223.106.169

   *  Port: 20210

   *  Connection type: SSH  

      <img src="images/PuTTY_Interface.jpg" width="350">

1. In the Terminal that appears, login using the following credentials (replace 'X' with the number assigned to you):

   *  Username: userX

   *  Password: userX

### 2.2 For Ubuntu/Debian PC
1. Access the command console
1. Update Package list
   ```bash
   sudo apt update
   ```

1. Install OpenSSH server
   ```bash
   sudo apt install openssh-server
   ```

1. SSH to the target VM (replace 'X' with the number assigned to you)  
   Password is the same as the username.
   ```bash
   ssh userX@111.223.106.169 -p 20210
   ```


<div style="page-break-after: always;"></div>

## 3. Hands-On Tasks
### 3.1 Task 1 - Introduction to Playbook

### 3.2 Task 2 - Using Variables

### 3.3 Task 3 - Privilege Escalation

### 3.4 Task 4 - Target Control


<div style="page-break-after: always;"></div>

## Appendix A
### Useful Ubuntu Commands
Change directory to current user's home directory
```bash
cd ~
```

Change directory to a specific path
```bash
cd /path/to/directory
```

Change directory to a relative path
```bash
cd path/to/directory/from/current/directory
```

List down all files and folders in the current directory
```bash
ls -al
```

List down all files and folders in the specified directory
```bash
ls -al /path/to/directory
```

Edit file with nano text editor  
To save your file when inside the editor: `CTRL` + `o`, then `ENTER`  
To exit the editor: `CTRL` + `x`  
```bash
nano your_file_name
```
