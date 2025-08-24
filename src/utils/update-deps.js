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
            const result = execSync('npm outdated --json', { encoding: 'utf8', cwd: this.rootDir });
            const outdated = JSON.parse(result || '{}');
            
            if (Object.keys(outdated).length === 0) {
                console.log('✅ Todas as dependências estão atualizadas!');
                return {};
            }
            
            console.log('📦 Dependências desatualizadas:');
            Object.entries(outdated).forEach(([pkg, info]) => {
                console.log(`   ${pkg}: ${info.current} → ${info.latest}`);
            });
            
            return outdated;
        } catch (error) {
            console.log('✅ Nenhuma dependência desatualizada encontrada');
            return {};
        }
    }

    updateDependencies(packages = []) {
        try {
            this.backupPackageJson();
            
            if (packages.length === 0) {
                console.log('🔄 Atualizando todas as dependências...');
                execSync('npm update --save', { stdio: 'inherit', cwd: this.rootDir });
            } else {
                console.log(`🔄 Atualizando dependências: ${packages.join(', ')}`);
                packages.forEach(pkg => {
                    execSync(`npm update ${pkg} --save`, { stdio: 'inherit', cwd: this.rootDir });
                });
            }
            
            console.log('✅ Dependências atualizadas com sucesso!');
            this.auditDependencies();
        } catch (error) {
            console.error('❌ Erro ao atualizar dependências:', error.message);
        }
    }

    auditDependencies() {
        try {
            console.log('🔒 Verificando vulnerabilidades...');
            execSync('npm audit', { stdio: 'inherit', cwd: this.rootDir });
        } catch (error) {
            console.log('⚠️  Vulnerabilidades encontradas. Execute "npm audit fix" para corrigir.');
        }
    }

    installMissing() {
        try {
            console.log('📦 Instalando dependências...');
            execSync('npm install', { stdio: 'inherit', cwd: this.rootDir });
            console.log('✅ Dependências instaladas com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao instalar dependências:', error.message);
        }
    }

    cleanInstall() {
        try {
            console.log('🧹 Limpando cache e reinstalando...');
            execSync('npm cache clean --force', { stdio: 'inherit', cwd: this.rootDir });
            
            try {
                const nodeModulesPath = path.join(this.rootDir, 'node_modules');
                const packageLockPath = path.join(this.rootDir, 'package-lock.json');
                
                if (fs.existsSync(nodeModulesPath)) {
                    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
                }
                if (fs.existsSync(packageLockPath)) {
                    fs.rmSync(packageLockPath, { force: true });
                }
            } catch (rmError) {
                console.log('⚠️  Não foi possível remover alguns arquivos, continuando...');
            }
            
            this.installMissing();
        } catch (error) {
            console.error('❌ Erro na limpeza:', error.message);
        }
    }

    backupPackageJson() {
        try {
            if (!fs.existsSync(this.backupsDir)) {
                fs.mkdirSync(this.backupsDir, { recursive: true });
            }
            
            const backupPath = path.join(this.backupsDir, `package-${Date.now()}.json`);
            fs.copyFileSync(this.packageJsonPath, backupPath);
            console.log(`📦 Backup criado: ${backupPath}`);
            return backupPath;
        } catch (error) {
            console.error('❌ Erro ao criar backup:', error.message);
        }
    }

    verifyDependencies() {
        try {
            console.log('🔎 Verificando integridade das dependências...');
            execSync('npm ls --depth=0', { stdio: 'inherit', cwd: this.rootDir });
            console.log('✅ Dependências verificadas com sucesso!');
        } catch (error) {
            console.error('❌ Problemas encontrados na árvore de dependências');
        }
    }
}

const manager = new DependencyManager();
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'check': manager.checkUpdates(); break;
    case 'update': manager.updateDependencies(args.slice(1)); break;
    case 'audit': manager.auditDependencies(); break;
    case 'install': manager.installMissing(); break;
    case 'clean': manager.cleanInstall(); break;
    case 'backup': manager.backupPackageJson(); break;
    case 'verify': manager.verifyDependencies(); break;
    default: console.log(`
🎵 Gerenciador de Dependências - Music Bot
Comandos: check, update, audit, install, clean, backup, verify
Ex: npm run deps:update discord.js
    `);
}