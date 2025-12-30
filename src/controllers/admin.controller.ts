
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const prisma = new PrismaClient();

export class AdminController {
    static async createSecurityPersonnel(req: Request, res: Response) {
        try {
            // Validation Schema
            const schema = z.object({
                email: z.string().email(),
                password: z.string().min(6),
                name: z.string().min(1),
                surname: z.string().min(1),
                phone: z.string().min(1),
                companyName: z.string().min(1),
                badgeNumber: z.string().optional(),
            });

            // Parse body
            const { email, password, name, surname, phone, companyName, badgeNumber } = schema.parse(req.body);

            // 1. Check or Create Company
            let company = await prisma.securityCompany.findFirst({
                where: { name: companyName }
            });

            if (!company) {
                company = await prisma.securityCompany.create({
                    data: {
                        name: companyName,
                        contactName: 'Admin', // Placeholder
                        phoneNumber: '0000000000', // Placeholder
                        email: 'admin@' + companyName.toLowerCase().replace(/\s+/g, '') + '.com',
                    }
                });
            }

            // 2. Check or Create User
            let user = await prisma.user.findUnique({
                where: { email }
            });

            if (user) {
                // Check if already personnel
                const existingPersonnel = await prisma.securityPersonnel.findUnique({
                    where: { userId: user.id }
                });
                if (existingPersonnel) {
                    return res.status(400).json({ error: 'User is already security personnel' });
                }
            } else {
                const hashedPassword = await bcrypt.hash(password, 10);
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
            const personnel = await prisma.securityPersonnel.create({
                data: {
                    userId: user.id,
                    companyId: company.id,
                    badgeNumber: badgeNumber || null,
                    status: 'offline'
                }
            });

            return res.json({
                success: true,
                data: {
                    userId: user.id,
                    personnelId: personnel.id,
                    company: company.name
                }
            });

        } catch (error: any) {
            console.error('Admin Create Security Personnel Error:', error);
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: error.errors });
            }
            return res.status(500).json({ error: error.message || 'Internal Server Error' });
        }
    }
}
