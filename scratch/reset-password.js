/**
 * Password Reset Script
 * Usage: npx ts-node scratch/reset-password.ts <username> <new-password>
 * Or run via: node -e "..." after building
 */

const { PrismaClient } = require('@prisma/client');

// Use dynamic import for bcryptjs to handle both v2 and v3
async function main() {
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();

    const targetUsername = process.argv[2] || 'Super Admin(hanif)';
    const newPassword = process.argv[3] || 'hanif13032549';

    try {
        console.log(`\n🔍 Looking for user: "${targetUsername}"`);
        
        // List all users first
        const allUsers = await prisma.user.findMany({ 
            select: { id: true, username: true, role: true, passwordHash: true } 
        });
        
        console.log(`\n📋 All users in database:`);
        allUsers.forEach(u => {
            console.log(`   - "${u.username}" (role: ${u.role}, hash prefix: ${u.passwordHash.substring(0, 7)})`);
        });

        const user = allUsers.find(u => u.username === targetUsername);
        
        if (!user) {
            console.log(`\n❌ User "${targetUsername}" not found!`);
            console.log(`   Available usernames: ${allUsers.map(u => `"${u.username}"`).join(', ')}`);
            await prisma.$disconnect();
            return;
        }

        console.log(`\n✅ Found user: "${user.username}" (id: ${user.id})`);

        // Test current password against existing hash
        console.log(`\n🧪 Testing current password "${newPassword}" against existing hash...`);
        const currentValid = await bcrypt.compare(newPassword, user.passwordHash);
        console.log(`   Result: ${currentValid ? '✅ MATCHES' : '❌ DOES NOT MATCH'}`);

        if (!currentValid) {
            // Re-hash and update
            console.log(`\n🔄 Re-hashing password with bcryptjs v${bcrypt.version || 'unknown'}...`);
            const newHash = await bcrypt.hash(newPassword, 10);
            console.log(`   New hash: ${newHash}`);
            
            // Verify the new hash works
            const verifyNew = await bcrypt.compare(newPassword, newHash);
            console.log(`   Verify new hash: ${verifyNew ? '✅ OK' : '❌ FAILED'}`);
            
            if (verifyNew) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { passwordHash: newHash }
                });
                console.log(`\n✅ Password updated successfully for "${user.username}"!`);
            } else {
                console.log(`\n❌ Something is wrong with bcrypt - new hash doesn't verify!`);
            }
        } else {
            console.log(`\n✅ Password already matches - no update needed.`);
            console.log(`   The issue might be elsewhere (check bcryptjs version compatibility).`);
            
            // Force re-hash anyway to ensure compatibility
            console.log(`\n🔄 Force re-hashing for compatibility...`);
            const newHash = await bcrypt.hash(newPassword, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: newHash }
            });
            console.log(`   ✅ Password re-hashed and saved.`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
