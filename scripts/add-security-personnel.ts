
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
};

async function main() {
    console.log('--- Add Security Personnel ---');

    try {
        const email = await question('Email: ');
        const password = await question('Password: ');
        const name = await question('First Name: ');
        const surname = await question('Surname: ');
        const phone = await question('Phone Number: ');
        const companyName = await question('Security Company Name: ');
        const badgeNumber = await question('Badge Number: ');

        // 1. Check or Create Company
        let company = await prisma.securityCompany.findFirst({
            where: { name: companyName }
        });

        if (!company) {
            console.log(`Creating new Security Company: ${companyName}...`);
            company = await prisma.securityCompany.create({
                data: {
                    name: companyName,
                    contactName: 'Admin', // Placeholder
                    phoneNumber: '0000000000', // Placeholder
                    email: 'admin@' + companyName.toLowerCase().replace(/\s+/g, '') + '.com', // Placeholder
                }
            });
        } else {
            console.log(`Found existing Security Company: ${company.name}`);
        }

        // 2. Create User
        const hashedPassword = await bcrypt.hash(password, 10);

        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            console.log('User already exists, checking if they are already security personnel...');
            // Check if already security personnel
            const existingPersonnel = await prisma.securityPersonnel.findUnique({
                where: { userId: user.id }
            });

            if (existingPersonnel) {
                console.error('Error: This user is already assigned as security personnel.');
                process.exit(1);
            }
        } else {
            console.log('Creating new User...');
            user = await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    name,
                    surname,
                    phoneNumber: phone,
                    isEmailValidated: true,
                    isPhoneValidated: true,
                }
            });
        }

        // 3. Create Security Personnel
        console.log('Assigning as Security Personnel...');
        const personnel = await prisma.securityPersonnel.create({
            data: {
                userId: user.id,
                companyId: company.id,
                badgeNumber,
                status: 'offline'
            }
        });

        console.log('Successfully added Security Personnel!');
        console.log('User ID:', user.id);
        console.log('Personnel ID:', personnel.id);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

main();
