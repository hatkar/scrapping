const express = require('express');
const axios = require('axios');
const qs = require('qs'); // pour encoder le body
const app = express();
const port = 3000;

// Identifiants API France Travail / Pôle Emploi
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

// 🔑 Obtenir un token OAuth2
async function getAccessToken() {
  try {
    const response = await axios.post(
      'https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=/partenaire',
      qs.stringify({
        grant_type: 'client_credentials',
        client_id,
        client_secret,
        scope: 'api_offresdemploiv2 o2dsoffre' // important pour accéder aux offres
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ Token généré avec succès :');
    console.log(response.data.access_token, '\n');

    return response.data.access_token;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du token :', error.response?.data || error.message);
    throw error;
  }
}

// 📌 Récupérer les offres d’emploi
async function fetchJobs(token) {
  try {
    const response = await axios.get(
      'https://api.pole-emploi.io/partenaire/offresdemploi/v2/offres/search',
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          motsCles: 'développeur',
          commune: '75056', // Paris
          range: '0-10'
        }
      }
    );

    console.log(`✅ ${response.data.resultats?.length || 0} offres récupérées`);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des offres :', error.response?.data || error.message);
    throw error;
  }
}

// 🚀 Route Express
app.get('/jobs', async (req, res) => {
  try {
    const token = await getAccessToken();
    const jobs = await fetchJobs(token);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${port}`);
  console.log(`👉 Appelle /jobs pour tester l'API\n`);
});
