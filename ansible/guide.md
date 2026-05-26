# Ansible Guide

This directory contains Ansible infrastructure-as-code for automated deployment and configuration of InfraShop.

## Structure

```
ansible/
├── playbook.yml           # Main Ansible playbook
└── roles/
    └── infrashop/         # InfraShop role with all tasks
        ├── handlers/      # Event handlers (e.g., service restart)
        ├── tasks/         # Task definitions for setup
        ├── templates/     # Jinja2 templates (configs, scripts)
        ├── vars/          # Variables and configuration
        └── meta/          # Role metadata
```

## Prerequisites

- **Ansible** installed on your control machine (the machine from which you run Ansible)
- **Access** to target servers with SSH key (usually passwordless)
- **Inventory file** configured with your target hosts

## Running the Playbook

### 1. Configure Inventory

Create an inventory file (e.g., `inventory.ini` or `hosts.yml`):

```ini
[infrashop]
infrashop.example.com ansible_user=root
```

Or using YAML format:

```yaml
all:
  children:
    infrashop:
      hosts:
        infrashop.example.com:
          ansible_user: root
```

### 2. Run the Playbook

```bash
# Run with default settings
ansible-playbook -i inventory.ini ansible/playbook.yml

# Run with extra variables
ansible-playbook -i inventory.ini ansible/playbook.yml -e "env=production"

# Run specific tags only
ansible-playbook -i inventory.ini ansible/playbook.yml --tags "docker,backend"

# Dry-run to see what would happen
ansible-playbook -i inventory.ini ansible/playbook.yml --check

# Verbose output for debugging
ansible-playbook -i inventory.ini ansible/playbook.yml -vvv
```

## Variables

Edit `roles/infrashop/vars/main.yml` to customize:

- **Application paths** and directories
- **Service names** and ports
- **User/group settings**
- **Environment variables**
- **URL and domain settings**

## Common Tasks

### Deploy Application

```bash
ansible-playbook -i inventory.ini ansible/playbook.yml --tags "deploy"
```

### Restart Services

```bash
# Using Ansible handlers
ansible-playbook -i inventory.ini ansible/playbook.yml --tags "restart"

# Or manually on the target:
sudo systemctl restart infrashop-backend
```

### Update Configuration

```bash
# Rebuild templates and restart
ansible-playbook -i inventory.ini ansible/playbook.yml --tags "config,handlers"
```

## Troubleshooting

### Connection Issues

```bash
# Test SSH connection
ansible -i inventory.ini infrashop -m ping

# Specify key file if needed
ansible-playbook -i inventory.ini ansible/playbook.yml --key-file ~/.ssh/id_rsa
```

### Check Syntax

```bash
ansible-playbook --syntax-check ansible/playbook.yml
```

### See What Changed

```bash
ansible-playbook -i inventory.ini ansible/playbook.yml --check --diff
```

## Documentation

- [Ansible Documentation](https://docs.ansible.com/)
- [Ansible Templates (Jinja2)](https://docs.ansible.com/ansible/latest/user_guide/playbooks_templating.html)
- [Using Variables](https://docs.ansible.com/ansible/latest/user_guide/playbooks_variables.html)

## Best Practices

1. **Test first**: Always run with `--check` before actual deployment
2. **Use tags**: Organize tasks with tags for targeted execution
3. **Version control**: Keep ansible/ directory in git
4. **Idempotency**: Write tasks that can be run multiple times safely
5. **Secrets**: Use Ansible Vault for sensitive data:
   ```bash
   ansible-vault create roles/infrashop/vars/secrets.yml
   ```

## See Also

- `../INSTALL_SERVER.md` - Detailed server installation guide
- `../scripts/setup_prod.sh` - Alternative production setup script
