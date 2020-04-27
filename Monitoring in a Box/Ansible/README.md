### Things to edit after you clone the repository

There are a few files which requires some input before the ansible script can be run.
1. In `host_vars/mib1.yaml` file edit the following variables:
    1. `ImageFormat` - Set the image type for the MiB VM
    1. `NewVmID` - Set the id number of the MiB VM to be created(Ensure no repeat in the cluster)
    1. `NewVmUsername` - Set the login user for MiB VM
    1. `NewVmIP` - Set the ip address of the MiB VM(Ensure no repeat in the cluster)

1. Create `.vault` file and fill it with the 'MiB .vault password' provided in 1password.

1. In `user_ssh_pub_key.txt` file, enter end user's ssh public key. This is to set up ssh password-less login to the MiB VM. (leave empty if user's public key is unknown)

When the config are set up, run the following commands to create and deploy MiB VM:
```
ansible-playbook -Ki inventory.yaml set_up_mib_host.yaml
```
- Ansible will prompt for `become` password, key in your pve5 sudo password.

After the Ansible script has set up the MiB VM, the next task is to extract the MiB VM image out for distribution to users. Use the following steps to extract the image of the MiB VM created to the local directory:
1. `ssh pve5` - From your local machine, ssh to pve5 because this is the Proxmox node where the MiB VM will be created on
1. `sudo cp /var/lib/vz/images/[NewVmID]/vm-[NewVmID]-disk-0.[ImageFormat] .` - copy MiB VM image to home directory
1. `sudo chown [username]:[username] vm-[NewVmID]-disk-0.[ImageFormat]` - change the ownership of the image to your username, so that you have the right privilege to extract the image to your local machine
1. Exit from the ssh session and run `scp pve5:/home/[username]/vm-[NewVmID]-disk-0.[ImageFormat] /mnt/c/Users/User/Desktop/[name of the image]` on your local machine, the MiB VM image will be extracted to your local machine desktop
