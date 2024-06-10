// gestion-de-stagiaires/app.js
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = 3000;
const DB_URL = 'mongodb://localhost:27017/gestionStagiaires';

// MongoDB Schema and Model
const stagiaireSchema = new mongoose.Schema({
  name: { type: String, required: true },
  filiereId: { type: mongoose.Types.ObjectId, required: true },
});
const Stagiaire = mongoose.model('Stagiaire', stagiaireSchema);

// Connect to MongoDB
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

// Add a new stagiaire
app.post('/stagiaires', async (req, res) => {
  const { name, filiereId } = req.body;

  try {
    // Check filiere availability
    const response = await axios.get(`http://localhost:3001/filieres/${filiereId}/check-disponibility`);
    if (!response.data.available) {
      return res.status(400).json({ message: 'No available places in the filiere' });
    }

    // Add stagiaire
    const stagiaire = new Stagiaire({ name, filiereId });
    await stagiaire.save();// SAVE IN THE DATABASE

    // Update filiere places
    await axios.post(`http://localhost:3001/filieres/${filiereId}/update-places`, { increment: -1 });

    res.status(201).json(stagiaire);
  } catch (error) {
    res.status(500).json({ message: 'Error adding stagiaire', error });
  }
});

// Delete a stagiaire
app.delete('/stagiaires/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const stagiaire = await Stagiaire.findByIdAndDelete(id);
    if (!stagiaire) {
      return res.status(404).json({ message: 'Stagiaire not found' });
    }

    // Update filiere places
    await axios.post(`http://localhost:3001/filieres/${stagiaire.filiereId}/update-places`, { increment: 1 });

    res.status(200).json({ message: 'Stagiaire deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting stagiaire', error });
  }
});

// Retrieve all stagiaires
app.get('/stagiaires', async (req, res) => {
  try {
    const stagiaires = await Stagiaire.find();
    res.status(200).json(stagiaires);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving stagiaires', error });
  }
});

// Retrieve a stagiaire by ID
app.get('/stagiaires/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const stagiaire = await Stagiaire.findById(id);
    if (!stagiaire) {
      return res.status(404).json({ message: 'Stagiaire not found' });
    }

    res.status(200).json(stagiaire);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving stagiaire', error });
  }
});

// Search for stagiaires by name or filiereId
app.get('/stagiaires/search', async (req, res) => {
  const { name, filiereId } = req.query;

  let searchCriteria = {};

  if (name) {
    searchCriteria.name = { $regex: name, $options: 'i' };
  }
  if (filiereId) {
    searchCriteria.filiereId = filiereId;
  }

  try {
    const stagiaires = await Stagiaire.find(searchCriteria);
    res.status(200).json(stagiaires);
  } catch (error) {
    res.status(500).json({ message: 'Error searching stagiaires', error });
  }
});

app.listen(PORT, () => {
  console.log(`Gestion de Stagiaires running on port ${PORT}`);
});
