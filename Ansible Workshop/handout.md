## 1. Setup Ansible
Ansible can be used to configure any target system that supports the SSH protocol and Python 2/3 library. However, Ansible's control node can only run on Unix OS (Ubuntu, MacOS, Red Hat, etc.). For this workshop, an Ubuntu 18.04 VM with Ansible is already prepared for you.

### 1.1 (Optional) Install Ansible
To install Ansible on an Ubuntu 18.04 VM, run the following commands as a sudo user:
```bash
sudo apt-add-repository ppa:ansible/ansible
sudo apt update
sudo apt install ansible
```

## 2. Access Ansible Host
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
1. Open up the command console
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
