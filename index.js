
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// HubSpot configuration
const HUBSPOT_SERVICE_KEY = process.env.HUBSPOT_SERVICE_KEY;
const HUBSPOT_OBJECT_TYPE_ID = process.env.HUBSPOT_OBJECT_TYPE_ID;

const HUBSPOT_API_URL = 'https://api.hubapi.com/crm/v3/objects';

const PORT = process.env.PORT || 3000;

// Common API headers
const getHubSpotHeaders = () => {
    if (!HUBSPOT_SERVICE_KEY) {
        throw new Error('HubSpot Service Key is missing. Check your .env file.');
    }

    if (!HUBSPOT_OBJECT_TYPE_ID) {
        throw new Error('HubSpot Object Type ID is missing. Check your .env file.');
    }

    return {
        Authorization: `Bearer ${HUBSPOT_SERVICE_KEY}`,
        'Content-Type': 'application/json'
    };
};

// Route 1: Homepage - Retrieve GTM Campaign records
app.get('/', async (req, res) => {
    try {
        const response = await axios.get(
            `${HUBSPOT_API_URL}/${HUBSPOT_OBJECT_TYPE_ID}`,
            {
                headers: getHubSpotHeaders(),
                params: {
                    limit: 100,
                    properties: 'name,campaign_type,target_audience'
                }
            }
        );

        const records = response.data.results || [];

        res.render('homepage', {
            title: 'GTM Campaigns | HubSpot Practicum',
            records,
            errorMessage: null
        });

    } catch (error) {
        console.error(
            'Error retrieving HubSpot records:',
            error.response?.data || error.message
        );

        res.status(500).render('homepage', {
            title: 'GTM Campaigns | HubSpot Practicum',
            records: [],
            errorMessage:
                error.response?.data?.message ||
                'Unable to retrieve records from HubSpot. Check your API configuration.'
        });
    }
});

// Route 2: Display the new campaign form
app.get('/update-cobj', (req, res) => {
    res.render('updates', {
        title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
        errorMessage: null,
        formData: {}
    });
});

// Route 3: Create a new GTM Campaign record
app.post('/update-cobj', async (req, res) => {
    const name = (req.body.name || '').trim();
    const campaignType = (req.body.campaign_type || '').trim();
    const targetAudience = (req.body.target_audience || '').trim();

    if (!name || !campaignType || !targetAudience) {
        return res.status(400).render('updates', {
            title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
            errorMessage: 'Please complete all three fields.',
            formData: req.body
        });
    }

    const newRecord = {
        properties: {
            name: name,
            campaign_type: campaignType,
            target_audience: targetAudience
        }
    };

    try {
        await axios.post(
            `${HUBSPOT_API_URL}/${HUBSPOT_OBJECT_TYPE_ID}`,
            newRecord,
            {
                headers: getHubSpotHeaders()
            }
        );

        res.redirect('/');

    } catch (error) {
        console.error(
            'Error creating HubSpot record:',
            error.response?.data || error.message
        );

        res.status(500).render('updates', {
            title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
            errorMessage:
                error.response?.data?.message ||
                'Unable to create the campaign. Please try again.',
            formData: req.body
        });
    }
});

// Start the application
app.listen(PORT, () => {
    console.log(`GTM Campaigns application running at http://localhost:${PORT}`);
});
