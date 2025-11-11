// mailService.js
const nodemailer = require("nodemailer");

// Create transporter for Outlook (Office 365 SMTP)
const transporter = nodemailer.createTransport({
 host: "smtp.office365.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: "sunilkumar@infotech.com",
    pass: "JKAL@2025",
  },
  tls: {
    ciphers: "SSLv3",
  },
});

// Function to send feedback/query email

const sendTaxInvoiceList = async (toEmail, postTotalInvoiceList) => {
    // console.log("toEmail", toEmail, "postTotalInvoiceList", typeof (postTotalInvoiceList));
    console.log("enter inot tax invoice", toEmail,);

    let arrayData = [];

    // Parse only once and ensure it's an array
    try {
        arrayData = JSON.parse(postTotalInvoiceList);
        // console.log("Parsed arrayData:", arrayData);
    } catch (e) {
        console.error("Error parsing postTotalInvoiceList:", e);
        return;
    }

    // console.log("arrayData:", arrayData);
    // console.log(Array.isArray(arrayData)); // Should print true if the data is an array

    // Ensure dataArray is an array
    let dataArray = Array.isArray(arrayData) ? arrayData : [arrayData];
    // console.log(Array.isArray(dataArray)); // Should print true

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        // console.error("Error: dataArray is undefined or empty", dataArray);
        tableRows = "<tr><td colspan='9'>No invoices found</td></tr>";
        return
    } else {
        // console.log("dataArray type:", typeof (dataArray), "dataArray", dataArray);

        // Ensure no undefined or null items in the array
        dataArray = dataArray.filter(item => item !== undefined && item !== null);
        // console.log("dataArray filtered:", dataArray);

        // Assuming dataArray is an array of objects, now you can map through it
        tableRows = dataArray.map((data, index) => {
            if (!data) {
                console.error("Error: data object is undefined", data);
                return "";
            }

            const header = data.header || {}; // Ensure header exists
            return `
                <tr>
                    <td>${data.invoiceUniqueNumber || 'N/A'}</td>
                    <td>${header.ProformaInvoiceDate || 'N/A'}</td>
                    <td>${header.ProformaCustomerName || 'N/A'}</td>
                    
                    <td>${header.ProformaCity || 'N/A'}</td>
                   
                    <td>${data.grandTotal || 'N/A'}</td>
                    <td>
    
</td>


                    
                </tr>
            `;
        }).join(""); // Ensure dataArray is an array

    }
    if (typeof window !== "undefined" && typeof document !== "undefined") {
        document.addEventListener('click', (event) => {
            console.log("Click event detected");

            if (event.target.classList.contains('approve-btn')) {
                const originalUniqueId = event.target.getAttribute('data-invoice-reference');
                console.log('Approve button clicked for originalUniqueId:', originalUniqueId);
                approveInvoice(originalUniqueId);
            }

            if (event.target.classList.contains('reject-btn')) {
                const originalUniqueId = event.target.getAttribute('data-invoice-reference');
                console.log('Reject button clicked for originalUniqueId:', originalUniqueId);
                rejectInvoice(originalUniqueId);
            }
        });
    } else {
        console.log("document is not available, likely running in a server environment.");
    }



     const mailOptions = {
        from: 'retailer@jkagri.com',
        to: toEmail,  // Use the toEmail parameter instead of obj.userEmail
        subject: 'Created Tax Invoices',
        html: `
        <p>Hi Team,</p>
        <p>Please find below the Invoice pending for your approval:</p>
        <table border="1" cellspacing="0" cellpadding="5" style="border-collapse: collapse; width: 100%;">
            <thead style="background-color: #f2f2f2;">
                <tr>
                    <th class="text-nowrap">Invoice Number</th>
                    <th class="text-nowrap">Invoice Date</th>
                    <th class="text-nowrap">Customer Name</th>
                   
                    <th class="text-nowrap">City</th>
                  
                    <th class="text-nowrap">Total Amount</th>
                    
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
        <p>Thanks,<br>The Approval Team</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Invoice email sent successfully");
    } catch (error) {
        console.error("Error sending invoice email", error);
    }
}

module.exports = { sendTaxInvoiceList };
