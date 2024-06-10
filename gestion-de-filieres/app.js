// gestion-de-filieres/app.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

const PORT = 3001;
const DB_URL = 'mongodb://localhost:27017/gestionFilieres';

// MongoDB Schema and Model
const filiereSchema = new mongoose.Schema({
  name: { type: String, required: true },
  availablePlaces: { type: Number, required: true },
});
const Filiere = mongoose.model('Filiere', filiereSchema);

// Connect to MongoDB
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Create a new filiere
app.post('/filieres', async (req, res) => {
  const { name, availablePlaces } = req.body;

  try {
    const newFiliere = new Filiere({ name, availablePlaces });
    await newFiliere.save();

    res.status(201).json(newFiliere);
  } catch (error) {
    res.status(500).json({ message: 'Error creating filiere', error });
  }
});

// Delete a filiere by ID
app.delete('/filieres/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const filiere = await Filiere.findByIdAndDelete(id);
    if (!filiere) {
      return res.status(404).json({ message: 'Filière not found' });
    }

    res.status(200).json({ message: 'Filière deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting filiere', error });
  }
});

// Retrieve all filieres
app.get('/filieres', async (req, res) => {
  try {
    const filieres = await Filiere.find();
    res.status(200).json(filieres);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving filieres', error });
  }
});

// Retrieve a filiere by ID
app.get('/filieres/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const filiere = await Filiere.findById(id);
    if (!filiere) {
      return res.status(404).json({ message: 'Filière not found' });
    }

    res.status(200).json(filiere);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving filiere', error });
  }
});

// Search for filieres by name or available places
app.get('/filieres/search', async (req, res) => {
  const { name, minPlaces, maxPlaces } = req.query;

  let searchCriteria = {};

  if (name) {
    searchCriteria.name = { $regex: name, $options: 'i' };
  }
  if (minPlaces) {
    searchCriteria.availablePlaces = { ...searchCriteria.availablePlaces, $gte: parseInt(minPlaces) };
  }
  if (maxPlaces) {
    searchCriteria.availablePlaces = { ...searchCriteria.availablePlaces, $lte: parseInt(maxPlaces) };
  }

  try {
    const filieres = await Filiere.find(searchCriteria);
    res.status(200).json(filieres);
  } catch (error) {
    res.status(500).json({ message: 'Error searching filieres', error });
  }
});

// Check filiere availability
app.get('/filieres/:id/check-disponibility', async (req, res) => {
  const { id } = req.params;

  try {
    const filiere = await Filiere.findById(id);
    if (!filiere) {
      return res.status(404).json({ message: 'Filière not found' });
    }

    res.status(200).json({ available: filiere.availablePlaces > 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error checking filiere availability', error });
  }
});

// Update filiere places
app.post('/filieres/:id/update-places', async (req, res) => {
  const { id } = req.params;
  const { increment } = req.body;

  try {
    const filiere = await Filiere.findById(id);
    if (!filiere) {
      return res.status(404).json({ message: 'Filière not found' });
    }

    filiere.availablePlaces += increment;
    await filiere.save();

    res.status(200).json(filiere);
  } catch (error) {
    res.status(500).json({ message: 'Error updating filiere places', error });
  }
});

app.listen(PORT, () => {
  console.log(`Gestion de Filières running on port ${PORT}`);
});
