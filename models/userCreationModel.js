const mongoose = require('mongoose');
const { reviewed } = require('../handlers/userHandler');

// User Schema
const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    confPassword: {
        type: String,
        required: true,
    },
    contact: {
        type: Number,
        required: true,
    },
    plant: {
        type: Number,
        required: false,
    },
    Design: {
        type: String,
        required: false,
    },
    function: {
        type: String,
        required: false,
    },

});

const itemSchema = new mongoose.Schema({
    Description: {
        type: String,
        required: false,
    },
    Material: {
        type: String,
        required: true,
    },
    UOM: {
        type: String,
        required: true,
    },
    Quantity: {
        type: String,
        required: true,
    },
    PreRate: {
        type: String,
        required: false,
    },
    vender1Rate: {
        type: String,
        required: false,
    },
    vender1Amount: {
        type: String,
        required: false,
    },
    vender2Rate: {
        type: String,
        required: false,
    },
    vender2Amount: {
        type: String,
        required: false,
    },
});

const approvalSchema = new mongoose.Schema(
    {
        header: {
            project: {
                type: String,
                required: true,
            },
            function: {
                type: String,
                required: true,
            },
            date: {
                type: String,
                required: false,
            },
            companyName: {
                type: String,
                required: false,
            },
            vender1: {
                type: String,
                required: false,
            },
            vender2: {
                type: String,
                required: false,
            },
            WBSElement: {
                type: String,
                required: false,
            },
            subject: {
                type: String,
                required: false,
            },
        },
        Item: [itemSchema], // Array of items
        referenceNo: {
            type: Number,
            required: false,
            unique: true,
        },
        status: { type: String, required: false }
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);
const counterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        unique: true,
    },
    value: {
        type: Number,
        default: 100000,
    },
});
const invoiceProformaInvoiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique: true,
    },

    value: {
        type: Number,
        default: 100,
    },
    startWith: {
        type: String,
        required: true
    },
});

const invoiceTaxInvoiceCountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique: true,
    },

    value: {
        type: Number,
        default: 800,
    },
    startWith: {
        type: String,
        required: true
    },
});


const serviceSchema = new mongoose.Schema({
    description: {
        type: String,
        required: false,
    },

    HSN_SAC: {
        type: String,
        required: false,
    },

    quantity: {
        type: Number,
        required: false,
    },
    UOM: {
        type: String,
        required: false,
    },
    rate: {
        type: String,
        required: false,
    },
    amount: {
        type: String,
        required: false,
    },
})
const taxSchema = new mongoose.Schema({
    description: {
        type: String,
        required: false,
    },
    percentage: {
        type: String,
        required: false,
    },
    amount: {
        type: String,
        required: false,
    },
})
const invoiceOriginalUniqueIdSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Ensure only one counter document exists
        default: "originalUniqueId", // Set a default name
    },
    value: {
        type: Number,
        default: 0, // Start from 0 or your desired starting number
    },
    // No startWith needed as we are using a single counter.
});
// Invoice schema
const invoiceSchema = new mongoose.Schema({

    // ... other fields
    originalUniqueId: {
        type: Number,
        required: true,
        unique: true, // Unique across ALL invoices
    },
    invoiceUniqueNumber: {
        type: String,
        required: true,
        unique: true,
    },
    header: {

        invoiceHeader: {
            type: String,
            required: false,
        },
        invoiceImage: {
            type: String,
            required: false,
        },
        ProformaCompanyName: {
            type: String,
            required: true,
        },

        ProformaCustomerName: {
            type: String,
            required: true,
        },
        ProformaAddress: {
            type: String,
            required: true,
        },
        ProformaCity: {
            type: String,
            required: true,
        },
        ProformaState: {
            type: String,
            required: true,
        },
        ProformaPincode: {
            type: String,
            required: true,
        },
        ProformaGstNo: {
            type: String,
            required: true,
        },
        ProformaPanNO: {
            type: String,
            required: true,
        },
        ProformaPoNumber: {
            type: String,
            required: true,
        },
        ProformaInvoiceNumber: {
            type: String,
            required: false,
        },
        ProformaInvoiceDate: {
            type: Date,
            required: true,
        },
        ProformaPan: {
            type: String,
            required: true,
        },
        ProformaGstNumber: {
            type: String,
            required: true,
        },
        ProformaTypeOfServices: {
            type: String,
            required: false,
        },
        notes: {
            type: String,
            required: false,
        },
        ProformaBankName: {
            type: String,
            required: true,
        },
        ProformaBankAccountNumber: {
            type: String,
            required: true,
        },
        ProformaIFSCcode: {
            type: String,
            required: true,
        },
        ProformaBranch: {
            type: String,
            required: true,
        },

        detailsCardAddress: {
            type: String,
            required: true,
        }

    },
    serviceList: [serviceSchema],
    taxList: [taxSchema],
    subtotal: {
        type: Number,
        required: true
    },
    grandTotal: {
        type: Number,
        required: true
    },
    amountInWords: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false
    },
    reason: {
        type: String,
        equired: false
    },
    invoiceApprovedOrRejectedByUser: {
        type: String,
        equired: false
    },
    invoiceUniqueNumber: {
        type: String,
        required: true,
        unique: true,
    },
    invoiceApprovedOrRejectedDateAndTime: {
        type: String,
        required: false
    },
    loggedInUser: {
        type: String,
        required: false
    },
    proformaCardHeaderId: {
        type: String,
        required: true
    },
    proformaCardHeaderName: {
        type: String,
        required: true
    },
    reviewedDescription: {
        type: String,
        required: false
    },
    reviewedDate: {
        type: String,
        required: false
    },
    reviewedLoggedIn: {
        type: String,
        required: false
    },
    createdByUser: {
        type: String,
        required: true
    },
    reviewed: {
        type: Boolean,
        required: true
    },
    reviewedReSubmited: {
        type: Boolean,
        required: true
    },
    pqSameforTAX: {
        type: String,
        required: true
    },
    pqStatus: {
        type: String,
        required: true
    },
    pqUniqueId: {
        type: Number,
        required: function () {
            return this.proformaCardHeaderId === "TAX";
        },
        default: 0 // Ensure it's never undefined or null
    },
    fundsRecievedDate: {
        type: String,
        required: false
    },
    refUTR: {
        type: String,
        required: false
    },
    actualAmountReceived: {
        type: String,
        required: false
    },
    DSC_Status: {
        type: String,
        required: false
    },
    DSC_UploadFile: {
        type: String,
        required: false
    }



    // bankDetails:{
    //     accountName:{
    //         type:String,
    //         required: true,
    //     },
    //     bank:{
    //         type:String,
    //         required: true,
    //     },
    //     accountNumber:{
    //         type:String,
    //         required: true,
    //     },
    //     branch:{
    //         type:String,
    //         required: true,
    //     },
    //     ifscCode:{
    //         type:String,
    //         required: true,
    //     }

    // }


});




const countryListSchema = new mongoose.Schema({
    code: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false
    },
})
const stateListSchema = new mongoose.Schema({

    code: {
        type: String,
        required: false
    },
    stateName: {
        type: String,
        required: false
    },
});

// Invoice schema
const invoiceLayoutSchema = new mongoose.Schema({

    invoiceLayoutId: {
        type: Number,
        required: true
    },

    header: {

        invoiceHeader: {
            type: String,
            required: false,
        },
        invoiceImage: {
            type: String,
            required: false,
        },

        ProformaCustomerName: {
            type: String,
            required: false,
        },
        ProformaAddress: {
            type: String,
            required: false,
        },
        ProformaCity: {
            type: String,
            required: false,
        },
        ProformaSate: {
            type: String,
            required: false,
        },
        ProformaPincode: {
            type: String,
            required: false,
        },
        ProformaGstNo: {
            type: String,
            required: false,
        },
        ProformaPanNO: {
            type: String,
            required: false,
        },
        ProformaPoNumber: {
            type: String,
            required: false,
        },
        ProformaInvoiceNumber: {
            type: String,
            required: false,
        },
        ProformaInvoiceDate: {
            type: String,
            required: false,
        },
        ProformaPan: {
            type: String,
            required: false,
        },
        ProformaGstNumber: {
            type: String,
            required: false,
        },
        ProformaTypeOfService: {
            type: String,
            required: false,
        },
        notes: {
            type: String,
            required: false,
        },
        ProformaBankName: {
            type: String,
            required: true,
        },
        ProformaBankAccountNumber: {
            type: String,
            required: true,
        },
        ProformaIFSCcode: {
            type: String,
            required: true,
        },
        ProformaBranch: {
            type: String,
            required: true,
        },
        ProformaAddress: {
            type: String,
            required: true,
        },
    },
    serviceList: [serviceSchema],
    taxList: [taxSchema],
    subtotal: {
        type: Number,
        required: false
    },
    grandTotal: {
        type: Number,
        required: false
    },
    // bankDetails:{
    //     accountName:{
    //         type:String,
    //         required: true,
    //     },
    //     bank:{
    //         type:String,
    //         required: true,
    //     },
    //     accountNumber:{
    //         type:String,
    //         required: true,
    //     },
    //     branch:{
    //         type:String,
    //         required: true,
    //     },
    //     ifscCode:{
    //         type:String,
    //         required: true,
    //     }

    // }

    status: {
        type: String,
        required: false
    }


});
const userCountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        unique: true,
    },

    value: {
        type: Number,
        default: 800,
    },
});

// user creation 
const userCreationSchema = new mongoose.Schema({
    userUniqueId: {
        type: Number,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true,
    },
    userFirstName: {
        type: String,
        required: true,
    },
    userLastName: {
        type: String,
        required: false,
    },
    userEmail: {
        type: String,
        required: true,
    },
    userContact: {
        type: String,
        required: true,
    },
    userPassword: {
        type: String,
        required: true,
    },
    userConfirmPassword: {
        type: String,
        required: true,
    },
    userStatus: {
        type: Boolean,
        required: true,
    },
    userActivity: {
        type: String,
        required: true,
    },




});


const customerCreationSchema = new mongoose.Schema({

    customerUniqueId: {
        type: Number,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerAddress: {
        type: String,
        required: true
    },
    customerCity: {
        type: String,
        required: true
    },
    customerState: {
        type: String,
        required: true
    },
    customerPincode: {
        type: String,
        required: true
    },
    customerGstNo: {
        type: String,
        required: true
    },
    customerPanNo: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerContact: {
        type: Number,
        required: true
    },
    customerAlernativecontact: {
        type: Number,
        required: false
    },
    customerCreditPeriod: {
        type: String,
        required: true
    }

})
const customerCountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        unique: true,
    },

    value: {
        type: Number,
        default: 800,
    },
});
const chargesCreationSchema = new mongoose.Schema({

    chargesUniqueId: {
        type: Number,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    servicesName: {
        type: String,
        required: true
    },
    poNumber: {
        type: String,
        required: true
    },
    HSN_SAC: {
        type: String,
        required: true
    },
    UOM: {
        type: String,
        required: true
    },

})
const chargesCountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        unique: true,
    },

    value: {
        type: Number,
        default: 800,
    },
});
const companyCreationSchema = new mongoose.Schema({

    companyUniqueId: {
        type: Number,
        required: true,
        unique: true
    },
    companyName: {
        type: String,
        required: true
    },
    companyAddress: {
        type: String,
        required: true
    },
    companyCity: {
        type: String,
        required: true
    },
    companyState: {
        type: String,
        required: true
    },
    companyPincode: {
        type: String,
        required: true
    },
    companyGstNo: {
        type: String,
        required: true
    },
    companyPanNo: {
        type: String,
        required: true
    },
    companyEmail: {
        type: String,
        required: true
    },
    companyFinanceContact: {
        type: String,
        required: true
    },
    companyAlernativecontact: {
        type: Number,
        required: false
    },
    companyBankName: {
        type: String,
        required: true
    },
    companyBankAccount_No: {
        type: String,
        required: true
    },
    companyIFSCcode: {
        type: String,
        required: true
    },
    companyBranchName: {
        type: String,
        required: true
    }

})
const companyCountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        unique: true,
    },

    value: {
        type: Number,
        default: 800,
    },
});

const Counter = mongoose.model('Counter', counterSchema);
const User = mongoose.model('User', userSchema);
const Approval = mongoose.model('Approval', approvalSchema);
const invoice = mongoose.model('NewInvoice', invoiceSchema)
const countries = mongoose.model('counters', countryListSchema)
const statee = mongoose.model('statee', stateListSchema);
const layout = mongoose.model('InvoiceLayout', invoiceLayoutSchema);
const invoiceproformaCount = mongoose.model('invoiceProformaCount', invoiceProformaInvoiceSchema)
const invoicetaxCount = mongoose.model('invoiceTaxCount', invoiceTaxInvoiceCountSchema)
const uniqueId = mongoose.model('invoiceOriginalId', invoiceOriginalUniqueIdSchema)
const userCreation = mongoose.model('userCreation', userCreationSchema);
const userCount = mongoose.model('userCount', userCountSchema);
const customerCreation = mongoose.model('customerCreation', customerCreationSchema);
const customerCount = mongoose.model('customerCount', customerCountSchema)
const chargesCreation = mongoose.model('chargesCreation', chargesCreationSchema)
const chargesCount = mongoose.model('chargeCount', chargesCountSchema)
const companyCreate = mongoose.model('companyCreation', companyCreationSchema);
const companyCount = mongoose.model('companyCount', companyCountSchema)




// Export as an object
module.exports = { User, Approval, Counter, invoice, countries, statee, layout, invoiceproformaCount, invoicetaxCount, uniqueId, userCreation, userCount, customerCreation, customerCount, chargesCreation, chargesCount, companyCreate, companyCount };
