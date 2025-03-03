const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); 


const CASHFREE_API_KEY = process.env.CASHFREE_API_KEY;
const CASHFREE_API_SECRET = process.env.CASHFREE_API_SECRET;
const CASHFREE_BASE_URL = 'https://api.cashfree.com/pg';

console.log('Server starting with configuration:', {
    apiKeyPresent: !!CASHFREE_API_KEY,
    apiSecretPresent: !!CASHFREE_API_SECRET,
    baseUrl: CASHFREE_BASE_URL
});

app.post('/create-order', async (req, res) => {
    try {
        const { orderAmount, customerName, customerEmail, customerPhone, bookId } = req.body;
        console.log('Creating order with bookId:', bookId);

        if (!orderAmount || !customerName || !customerEmail || !customerPhone) {
            console.error('Missing required fields:', { orderAmount, customerName, customerEmail, customerPhone });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate a unique order ID
        const orderId = 'order_' + Date.now();
        console.log('Generated orderId:', orderId);

        // Step 1: Create order
        console.log('Creating order with Cashfree...');
        console.log('Using API Key:', CASHFREE_API_KEY.substring(0, 10) + '...');
        console.log('Using API Secret:', CASHFREE_API_SECRET.substring(0, 10) + '...');
        
        const orderPayload = {
            order_id: orderId,
            order_amount: parseFloat(orderAmount),
            order_currency: "INR",
            customer_details: {
                customer_id: 'cust_' + Date.now(),
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone
            },
            order_meta: {
                return_url: `http://localhost:3000/payment-success.html?order_id=${orderId}&book_id=${bookId}`,
                payment_methods: "cc,dc,upi,nb"
            }
            
        };
        console.log('Order payload:', orderPayload);

        try {
            const orderResponse = await axios.post(
                `${CASHFREE_BASE_URL}/orders`,
                orderPayload,
                {
                    headers: {
                        'x-client-id': CASHFREE_API_KEY,
                        'x-client-secret': CASHFREE_API_SECRET,
                        'x-api-version': '2022-09-01',
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Order API Response:', {
                status: orderResponse.status,
                statusText: orderResponse.statusText,
                headers: orderResponse.headers,
                data: orderResponse.data
            });

            if (!orderResponse.data.payment_session_id) {
                throw new Error('No payment_session_id in response');
            }

            // Return order details and payment session ID to the frontend
            const responseData = {
                orderId: orderId,
                orderToken: orderResponse.data.payment_session_id,
                bookId: bookId,
                status: 'SUCCESS'
            };
            console.log('Sending response:', responseData);
            res.json(responseData);

        } catch (error) {
            console.error('Order creation failed:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error; // Re-throw to be caught by the outer try-catch
        }

    } catch (error) {
        // Log detailed error information
        console.error('Cashfree API Error Details:');
        console.error('- Error Message:', error.message);
        console.error('- Status Code:', error.response?.status);
        console.error('- Response Data:', error.response?.data);
        console.error('- Stack Trace:', error.stack);
        
        if (error.response?.data) {
            console.error('- API Error:', {
                message: error.response.data.message,
                code: error.response.data.code,
                type: error.response.data.type
            });
        }

        // Check for specific error conditions
        if (!CASHFREE_API_KEY || !CASHFREE_API_SECRET) {
            return res.status(500).json({
                error: 'Failed to create order',
                details: 'Missing API credentials'
            });
        }

        res.status(500).json({
            error: 'Failed to create order',
            details: error.response?.data || {
                message: error.message,
                code: 'UNKNOWN_ERROR',
                type: 'api_error'
            }
        });
    }
});

// Add route to handle PDF downloads
app.get('/ebooks/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const { orderId } = req.query;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        // Validate the order (you should implement this based on your order storage)
        // This is just a placeholder
        // const isValidOrder = await validateOrder(orderId);
        // if (!isValidOrder) {
        //     return res.status(403).json({ error: 'Invalid or expired order' });
        // }

        const filePath = path.join(__dirname, 'ebooks', filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'PDF file not found' });
        }

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Stream the PDF file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error serving PDF:', error);
        res.status(500).json({ error: 'Error serving PDF file' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
