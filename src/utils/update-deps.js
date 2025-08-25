const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DependencyManager {
    constructor() {
        this.rootDir = path.join(__dirname, '..', '..');
        this.packageJsonPath = path.join(this.rootDir, 'package.json');
        this.packageLockPath = path.join(this.rootDir, 'package-lock.json');
        this.backupsDir = path.join(this.rootDir, 'backups');
    }

    checkUpdates() {
        try {
            console.log('🔍 Verificando atualizações disponíveis...');
            // Garante que, mesmo se houver pacotes desatualizados, não quebre o script
            const result = execSync('npm outdated --json || echo "{}"', { encoding: 'utf8', cwd: this.rootDir });
            const outdated = JSON.parse(result || '{}');

            if (Object.keys(outdated).length === 0) {
                console.log('✅ Todas as dependências estão atualizadas!');
                return {};
            }

            console.log('📦 Dependências desatualizadas:');
            Object.entries(outdated).forEach(([pkg, info]) => {
                console.log(`- ${pkg}: ${info.current} → ${info.latest}`);
            });

            return outdated;
        } catch (error) {
            console.error('❌ Erro ao verificar atualizações:', error.message);
            return {};
        }
    }

    audit() {
        try {
            console.log('🔒 Executando auditoria de segurança...');
            const result = execSync('npm audit --json || echo "{}"', { encoding: 'utf8', cwd: this.rootDir });
            const audit = JSON.parse(result || '{}');

            if (!audit.vulnerabilities || Object.keys(audit.vulnerabilities).length === 0) {
                console.log('✅ Nenhuma vulnerabilidade encontrada!');
                return {};
            }

            console.log('⚠️ Vulnerabilidades detectadas:');
            Object.keys(audit.vulnerabilities).forEach(vuln => {
                console.log(`- ${vuln}: ${audit.vulnerabilities[vuln].severity}`);
            });

            return audit;
        } catch (error) {
            console.error('❌ Erro ao executar auditoria:', error.message);
            return {};
        }
    }

    // Você pode expandir com outros métodos: update, install, clean, etc.
}

const manager = new DependencyManager();

// Permite rodar pelos scripts do package.json
const action = process.argv[2];
switch (action) {
    case 'check':
        manager.checkUpdates();
        break;
    case 'audit':
        manager.audit();
        break;
    default:
        console.log(`ℹ️ Ação desconhecida: ${action}`);
        break;
}
