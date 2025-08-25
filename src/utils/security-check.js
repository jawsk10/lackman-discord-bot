const fs = require('fs');
const path = require('path');

class SecurityChecker {
    constructor() {
        this.packageJsonPath = path.join(__dirname, 'package.json');
        this.vulnerablePackages = {
            'discord.js': '^13.0.0', // Versão mais realista
            'dotenv': '^16.0.0'
        };
        this.loadPackageJson();
    }

    loadPackageJson() {
        try {
            if (fs.existsSync(this.packageJsonPath)) {
                this.packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            } else {
                // Tenta encontrar o package.json em diretórios comuns
                const alternativePaths = [
                    path.join(__dirname, '..', 'package.json'),
                    path.join(process.cwd(), 'package.json')
                ];
                
                for (const altPath of alternativePaths) {
                    if (fs.existsSync(altPath)) {
                        this.packageJsonPath = altPath;
                        this.packageJson = JSON.parse(fs.readFileSync(altPath, 'utf8'));
                        console.log(`📦 package.json encontrado em: ${altPath}`);
                        break;
                    }
                }
                
                if (!this.packageJson) {
                    throw new Error('package.json não encontrado');
                }
            }
        } catch (error) {
            console.error('❌ Erro ao carregar package.json:', error.message);
            process.exit(1);
        }
    }

    checkVersions() {
        console.log('🔒 Verificando versões de segurança...\n');
        console.log(`📁 Usando: ${this.packageJsonPath}\n`);
        
        let allSecure = true;
        const { dependencies = {}, devDependencies = {} } = this.packageJson;
        const allDeps = { ...dependencies, ...devDependencies };
        
        Object.entries(this.vulnerablePackages).forEach(([pkg, minVersion]) => {
            const currentVersion = allDeps[pkg];
            
            if (!currentVersion) {
                console.log(`❌ ${pkg}: Não instalado`);
                allSecure = false;
                return;
            }
            
            if (this.isVersionSecure(currentVersion, minVersion)) {
                console.log(`✅ ${pkg}: ${currentVersion} (Seguro)`);
            } else {
                console.log(`⚠️  ${pkg}: ${currentVersion} (Necessita ${minVersion}+)`);
                allSecure = false;
            }
        });
        
        console.log('\n' + '='.repeat(50));
        console.log(allSecure ? '✅ Todas as dependências seguras!' : '❌ Algumas necessitam atenção!');
        return allSecure;
    }

    isVersionSecure(current, minVersion) {
        try {
            const cleanCurrent = current.replace(/^[\^~]/, '');
            const cleanMin = minVersion.replace(/^[\^~]/, '');
            return this.compareVersions(cleanCurrent, cleanMin) >= 0;
        } catch {
            return false;
        }
    }

    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        return 0;
    }
}

// Executa a verificação
try {
    new SecurityChecker().checkVersions();
} catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
}