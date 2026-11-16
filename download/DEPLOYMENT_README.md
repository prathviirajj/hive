# HIVE QMS - Deployment Guide

## Prerequisites
- Node.js 18+ (or Bun)
- SQLite (bundled, no external DB needed)

## Installation
1. Extract the zip file
2. Run `npm install` (or `bun install`)
3. Run `npx prisma generate`
4. Run `npx prisma db push` to create/sync the database
5. Run `npx tsx src/lib/seed-users.ts` to seed the organization users
6. Start with `npm run dev` (development) or `npm run build && npm run start` (production)

## Default Login Credentials
- Admin: admin / admin2026
- Director: yogesh.jadhav / director2026
- DGM Quality: balasaheb.daphal / dgm2026
- Section Head: roshan.gaikar / section2026
- Quality Manager: rohit.giri / qual2026
- Inspector: rohan.ghodvinde / qc2026
- Operator: operator.fab.a / operator2026

## Environment
- Database: SQLite at db/custom.db
- Port: 3000 (configurable)
- Plant: K2 Khopoli

## Architecture
- Next.js 16 with Turbopack
- Prisma ORM with SQLite
- Tailwind CSS 4
- shadcn/ui components
- Role-Based Access Control (RBAC)
- Dark Mode support (Light/Dark/System)
