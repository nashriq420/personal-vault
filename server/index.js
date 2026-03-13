const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the 'dist' directory (frontend build)
app.use(express.static(path.join(__dirname, '../dist')));

// Simple Auth Middleware
const ADMIN_EMAIL = 'nshrqirfn@gmail.com';
const ADMIN_PASSWORD = 'Starsun2097!';

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.json({ success: true, user: { email: ADMIN_EMAIL } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// GET all people with their dynamic fields and linked people
app.get('/api/people', async (req, res) => {
  try {
    const people = await prisma.person.findMany({
      include: {
        dynamicFields: true,
        linkedPeople: {
          include: {
            dynamicFields: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(people);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single person
app.get('/api/people/:id', async (req, res) => {
  try {
    const person = await prisma.person.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        dynamicFields: true,
        linkedPeople: {
          include: {
            dynamicFields: true
          }
        }
      }
    });
    res.json(person);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Create new person
app.post('/api/people', async (req, res) => {
  const { name, nric, studentId, taxNumber, address, bankAccount, dynamicFields, linkedPeople } = req.body;
  try {
    const person = await prisma.person.create({
      data: {
        name,
        nric,
        studentId,
        taxNumber,
        address,
        bankAccount,
        dynamicFields: {
          create: dynamicFields?.map(f => ({
            type: f.type,
            label: f.label,
            value: f.value
          })) || []
        },
        linkedPeople: {
          create: linkedPeople?.map(l => ({
            name: l.name,
            relationship: l.relationship,
            nric: l.nric,
            studentId: l.studentId,
            taxNumber: l.taxNumber,
            address: l.address,
            bankAccount: l.bankAccount,
            dynamicFields: {
              create: l.dynamicFields?.map(lf => ({
                type: lf.type,
                label: lf.label,
                value: lf.value
              })) || []
            }
          })) || []
        }
      },
      include: {
        dynamicFields: true,
        linkedPeople: {
          include: {
            dynamicFields: true
          }
        }
      }
    });
    res.status(201).json(person);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Update person
app.put('/api/people/:id', async (req, res) => {
  const { id } = req.params;
  const { name, nric, studentId, taxNumber, address, bankAccount, dynamicFields, linkedPeople } = req.body;
  try {
    // Delete existing relations and recreate
    await prisma.dynamicField.deleteMany({ where: { personId: parseInt(id) } });
    await prisma.linkedPerson.deleteMany({ where: { parentId: parseInt(id) } });

    const person = await prisma.person.update({
      where: { id: parseInt(id) },
      data: {
        name,
        nric,
        studentId,
        taxNumber,
        address,
        bankAccount,
        dynamicFields: {
          create: dynamicFields?.map(f => ({
            type: f.type,
            label: f.label,
            value: f.value
          })) || []
        },
        linkedPeople: {
          create: linkedPeople?.map(l => ({
            name: l.name,
            relationship: l.relationship,
            nric: l.nric,
            studentId: l.studentId,
            taxNumber: l.taxNumber,
            address: l.address,
            bankAccount: l.bankAccount,
            dynamicFields: {
              create: l.dynamicFields?.map(lf => ({
                type: lf.type,
                label: lf.label,
                value: lf.value
              })) || []
            }
          })) || []
        }
      },
      include: {
        dynamicFields: true,
        linkedPeople: {
          include: {
            dynamicFields: true
          }
        }
      }
    });
    res.json(person);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE person
app.delete('/api/people/:id', async (req, res) => {
  try {
    await prisma.person.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all to serve the frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
