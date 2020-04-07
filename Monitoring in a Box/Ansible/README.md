### Things to edit after you clone the repository

There are a few files which requires some input before the ansible script can be run.
1. In `group_vars/all.yaml` file edit the following variables:
    1. `NewVmID` - Set the id number of the MiB VM to be created(Ensure no repeat in the cluster)
    1. `NewVmPassword` - Set the password for the MiB VM
    1. `NewVmIP` - Set the ip address of the MiB VM(Ensure no repeat in the cluster)
    1. `SshJumpHost` - Enter the public IP and port number

1. In `inventory.yaml` file under the vars section for both group:
    1. Fill in the IP address set for the MiB VM - This is the same IP as `NewVmIP` variable set in `group_vars/all.yml`
    1. `ansible_become_pass` for pve_node - This is the sudo password for your user in pve_node server
    1. `ansible_become_pass` for mib_host - This is the sudo password for your user in MiB VM which is set in `group_vars/all.yaml` file under `NewVmPassword`

1. In `roles/create_useraccount/files/sshpubkeys` file, enter the public key of your ansible host machine. This is to set up ssh pasword-less login to the MiB VM.

When the config are set up, run the following commands to create and deploy MiB VM:
```
ansible-playbook -i inventory.yaml set_up_mib_host.yaml
```
