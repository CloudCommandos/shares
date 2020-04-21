### Things to edit after you clone the repository

There are a few files which requires some input before the ansible script can be run.
1. In `host_vars/mib1.yaml` file edit the following variables:
    1. `ImageFormat` - Set the image type for the MiB VM
    1. `NewVmID` - Set the id number of the MiB VM to be created(Ensure no repeat in the cluster)
    1. `NewVmUsername` - Set the login user for MiB VM
    1. `NewVmIP` - Set the ip address of the MiB VM(Ensure no repeat in the cluster)

1. Create `.vault` file and fill it with the password provided.

1. In `user_ssh_pub_key.txt` file, enter end user's ssh public key. This is to set up ssh password-less login to the MiB VM. (leave empty if user's public key is unknown)

When the config are set up, run the following commands to create and deploy MiB VM:
```
ansible-playbook -Ki inventory.yaml set_up_mib_host.yaml
```
- Ansible will prompt for `become` password, key in your pve5 sudo password.
