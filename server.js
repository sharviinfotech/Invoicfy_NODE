const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const connectDB = require('./config/db');
const { fetchInvoiceList, } = require('./fetchInvoiceFolder/totalInvoiceData'); // Fixed typo here\
const{sendInvoiceDataToEmail} =require('./fetchInvoiceFolder/sendInvoiceToMail')
const userHandler = require('./handlers/userHandler');
const recevieInvoiceSendToMail = require('./fetchInvoiceFolder/intialmailsend')
// Initialize App
const app = express();
const { BASE_SERVER_URL, BASE_PORT } = require('./baseFile');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load Routes
app.use('/api', routes);

// Database Connection
connectDB();

// Server Initialization
app.listen(BASE_PORT, () => console.log(`Server running on port ${BASE_PORT}`));
recevieInvoiceSendToMail.send()

// async function postInvoiceListInMail() {
//     try {
//         console.log("postInvoiceListInMail");

//         const reqBody = {
//             userActivity: "MD" // or "ADMIN" based on your requirement
//         };

//         // Call the API
//         const response = await fetch("http://localhost:3000/api/invoice/getAllInvoices", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify(reqBody),
//         });

//         // Parse the response
//         const responseData = await response.json();
//         if (responseData.status !== 200) {
//             throw new Error(responseData.message || "Failed to fetch invoice data");
//         }

//         const invoiceData = responseData.data;
//         console.log("Invoice data received:", invoiceData);

//         // Send email
//         const email = "sunilkumar@sharviinfotech.com";
//         await sendInvoiceDataToEmail(email, JSON.stringify(invoiceData, null, 2));

//     } catch (error) {
//         console.error("Error fetching invoice data:", error.message);
//     }
// }

// postInvoiceListInMail();



















// async function postInvoiceListInMail() {
//     try {
//         // const invoiceData = await fetchInvoiceList();  // Get the current invoice data
//         const invoiceData = await userHandler.getTotalInvoice(req,res);
//         // Check if the invoice data has changed (simple comparison for illustration)
//         // if (JSON.stringify(invoiceData) !== JSON.stringify(lastInvoiceData)) {
//             console.log('Invoice data has changed. Sending email...');
//             const email = "sunilkumar@sharviinfotech.com";
//             await sendInvoiceDataToEmail(email, JSON.stringify(invoiceData, null, 2));
            
//             // Update the last known invoice data
//             lastInvoiceData = invoiceData;
//         // } else {
//         //     console.log('No changes in invoice data. No email sent.');
//         // }
//     } catch (error) {
//         console.error('Error fetching invoice data:', error.message);
//     }
// }

// postInvoiceListInMail();
